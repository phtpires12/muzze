
## Correção: Login com Google e Apple retorna 404 no domínio publicado

### Causa raiz

Dois problemas combinados causam o erro no domínio publicado:

**1. Auth-bridge interceptando o redirect OAuth**

O Lovable usa um "auth-bridge" interno que, em domínios customizados (como `muzze.lovable.app` ou `www.muzze.app`), não consegue redirecionar o usuário de volta corretamente após o login via Google/Apple. O resultado é um 404. No preview (`*.lovableproject.com`), o bridge funciona normalmente.

A solução para domínios customizados é usar `skipBrowserRedirect: true` diretamente pelo Supabase client, contornando o bridge. Porém, como o projeto usa o módulo `lovable.auth.signInWithOAuth`, a alternativa é detectar o domínio customizado e acionar o fluxo manualmente.

**2. Service Worker do PWA interceptando `/~oauth`**

O Workbox (configurado no `vite.config.ts`) tem uma regra de navegação `NetworkFirst` para todas as rotas SPA. Isso faz com que o Service Worker intercepte a rota `/~oauth` — que é o callback do OAuth — e sirva o `index.html` em vez de deixar a requisição ir direto para a rede. O resultado é que o token de autenticação nunca é processado corretamente.

A correção obrigatória é adicionar `/~oauth` na lista `navigateFallbackDenylist` do Workbox.

### Solução

**Mudança 1: `vite.config.ts` — Excluir `/~oauth` do Service Worker (crítico)**

Adicionar `navigateFallbackDenylist` na configuração do Workbox para que o Service Worker nunca intercepte as rotas de OAuth:

```typescript
workbox: {
  navigateFallbackDenylist: [/^\/~oauth/],
  // ... resto da config
}
```

**Mudança 2: `SocialLoginButtons.tsx` — Detecção de domínio customizado**

Modificar `handleOAuth` para detectar se o usuário está em um domínio customizado. Se sim, usar `supabase.auth.signInWithOAuth` com `skipBrowserRedirect: true` para obter a URL diretamente e redirecionar manualmente, contornando o auth-bridge:

```typescript
const handleOAuth = async (provider: "google" | "apple") => {
  const isCustomDomain =
    !window.location.hostname.includes("lovable.app") &&
    !window.location.hostname.includes("lovableproject.com") &&
    !window.location.hostname.includes("localhost");

  if (isCustomDomain) {
    // Domínio customizado: contornar o auth-bridge
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  } else {
    // Preview/Lovable domains: usar fluxo normal com lovable.auth
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
  }
};
```

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `vite.config.ts` | Adicionar `navigateFallbackDenylist: [/^\/~oauth/]` no Workbox |
| `src/components/auth/SocialLoginButtons.tsx` | Detectar domínio customizado e usar fluxo alternativo |

### Por que isso funciona

- **No preview** (`*.lovableproject.com`): o caminho normal via `lovable.auth.signInWithOAuth` continua sendo usado — sem mudança de comportamento.
- **No publicado** (`muzze.lovable.app` / domínio customizado): o fluxo vai direto para o provider (Google/Apple) e volta para a origem correta, sem passar pelo auth-bridge.
- **O Service Worker** não vai mais interceptar `/~oauth`, então os tokens OAuth são processados pela rede normalmente.

### O que não muda

- O fluxo de email/senha continua idêntico
- A aparência e UX do componente são idênticos
- Nenhuma outra tela é afetada
