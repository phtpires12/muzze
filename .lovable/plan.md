
## Diagnóstico: Erro `missing OAuth secret`

### Causa raiz definitiva

O fluxo OAuth do Google/Apple **só funciona via `lovable.auth.signInWithOAuth`**, pois é esse módulo que usa as credenciais do Google gerenciadas pelo Lovable Cloud. Quando chamamos `supabase.auth.signInWithOAuth` diretamente (como os fixes anteriores fizeram), a requisição vai para o Supabase puro — que não tem Google OAuth configurado — resultando em `"Unsupported provider: missing OAuth secret"`.

O histórico de mudanças criou um conflito:
- Fix #1: detectar domínio customizado → substituir por `supabase.auth` → QUEBROU as credenciais
- Fix #2: detectar iframe → substituir por `supabase.auth` → QUEBROU as credenciais

### Solução correta

Usar `lovable.auth.signInWithOAuth` em **todos os ambientes** (preview, domínio customizado, iframe), pois só ele tem acesso às credenciais OAuth do Google/Apple.

O problema do iframe (sessão não detectada após login) deve ser resolvido com **polling de sessão** após chamar `lovable.auth`, não com a troca para `supabase.auth`.

Como `lovable.auth.signInWithOAuth` funciona internamente:
1. Abre um popup com a URL do Google (via Lovable Cloud)
2. Usuário faz login
3. O auth-bridge processa os tokens e chama `supabase.auth.setSession(result.tokens)` no contexto do popup
4. O popup envia uma mensagem `postMessage` de volta

O problema no iframe é que o `postMessage` do popup vai para `window.parent` (o editor da Lovable), não para o app dentro do iframe. A sessão é estabelecida localmente no popup, mas o app no iframe não fica sabendo.

**Solução para o iframe:** após chamar `lovable.auth.signInWithOAuth`, iniciar um polling que verifica `supabase.auth.getSession()` a cada 1 segundo. Quando a sessão aparecer (o lovable.auth a salva no localStorage que é compartilhado), recarregar a página.

Para domínio customizado (`www.muzze.app`): `lovable.auth.signInWithOAuth` deve funcionar normalmente via redirect, pois o domínio está configurado no Lovable Cloud. O erro 404 original que motivou o fix pode ter tido outra causa — testar novamente com `lovable.auth` puro.

### Implementação

**`src/components/auth/SocialLoginButtons.tsx`** — reverter para `lovable.auth` em todos os casos + polling para iframe:

```typescript
const handleOAuth = async (provider: "google" | "apple") => {
  setLoadingProvider(provider);
  try {
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      // No iframe: chamar lovable.auth normalmente (usa credenciais gerenciadas)
      // e iniciar polling para detectar quando a sessão for criada
      lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      // Polling: verificar a cada 1s se a sessão foi estabelecida
      // (o popup abre e seta a sessão no localStorage)
      const pollInterval = setInterval(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          clearInterval(pollInterval);
          window.location.reload();
        }
      }, 1000);

      // Cancelar polling após 5 minutos (timeout de segurança)
      setTimeout(() => {
        clearInterval(pollInterval);
        setLoadingProvider(null);
      }, 5 * 60 * 1000);

    } else {
      // Fora do iframe (custom domain ou preview top-level): fluxo normal
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    }
  } catch {
    toast({
      title: "Erro inesperado",
      description: "Algo deu errado. Tente novamente.",
      variant: "destructive",
    });
    setLoadingProvider(null);
  }
};
```

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/auth/SocialLoginButtons.tsx` | Reverter para `lovable.auth.signInWithOAuth` em todos os casos; adicionar polling de sessão para o contexto de iframe |

### Matriz de comportamento final

| Ambiente | Detecção | Fluxo |
|---|---|---|
| Preview no editor (iframe) | `window.self !== window.top === true` | `lovable.auth` (credentials OK) + polling de getSession() para detectar conclusão |
| App publicado (`www.muzze.app`) | `isInIframe === false` | `lovable.auth` normal (redirect via Lovable Cloud) |
| Preview standalone (top-level) | `isInIframe === false` | `lovable.auth` normal |

### O que NÃO muda

- Fluxo de email/senha inalterado
- Aparência dos botões idêntica
- O fix do Service Worker (`navigateFallbackDenylist`) no `vite.config.ts` permanece — ainda é necessário para evitar que o PWA intercepte rotas OAuth

### Por que isso resolve

- `lovable.auth.signInWithOAuth` usa as credenciais Google gerenciadas → sem mais `missing OAuth secret`
- O polling de `getSession()` detecta a sessão criada pelo popup no localStorage compartilhado → resolve o problema do iframe
- No domínio publicado, o `lovable.auth` usa redirect normal → deve funcionar após o fix do Service Worker já aplicado
