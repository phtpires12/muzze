
## Correção: Login Google/Apple não detecta sessão no preview (iframe)

### Causa raiz

O preview da Lovable roda dentro de um **`<iframe>`** embutido no editor. Quando o `lovable.auth.signInWithOAuth` é chamado, o auth-bridge abre uma popup do Google. Após o login, o auth-bridge tenta enviar os tokens de volta via `window.postMessage` — mas o destinatário da mensagem é o `window.parent` do popup. Como o app está num iframe, o `window.parent` do popup não é o app em si, mas sim o editor da Lovable. A mensagem nunca chega, `supabase.auth.setSession` nunca é chamado, e a sessão não é estabelecida.

Esse problema **só existe no preview (iframe)**. No app publicado, o app roda em top-level e o `lovable.auth` funciona corretamente. Porém, com o fix anterior para domínios customizados (`muzze.lovable.app` / `www.muzze.app`), o app publicado já usa o caminho direto via Supabase — então o fix atual só vai impactar o preview.

### Solução

Adicionar uma terceira ramificação de detecção no `handleOAuth`:

```
1. Está dentro de iframe?  → popup com supabase.auth + postMessage listener
2. Domínio customizado?    → redirect direto via supabase.auth (já implementado)
3. Preview top-level?      → lovable.auth (já implementado, raramente usado)
```

**Detecção de iframe:**
```typescript
const isInIframe = window.self !== window.top;
```

**Fluxo para iframe (popup com listener):**
1. Chamar `supabase.auth.signInWithOAuth({ provider, options: { skipBrowserRedirect: true } })` para obter a URL OAuth sem redirecionar
2. Abrir a URL em `window.open(url, 'oauth', 'width=500,height=600')` — popup controlado pelo app
3. Registrar um `message` event listener em `window` para capturar quando a popup retornar
4. A Lovable Cloud envia um `postMessage` para o opener (`window.opener`) após o OAuth completo com `{ type: 'oauth-complete' }` ou simplesmente quando a popup navega de volta para a origem
5. Ao detectar a conclusão: fechar a popup, remover o listener, e forçar `supabase.auth.getSession()` para recarregar a sessão

Como a Lovable Cloud usa seu próprio callback em `/~oauth` que processa os tokens e depois redireciona para a `redirect_uri`, o que acontece é:
- Popup abre: `https://accounts.google.com/...`
- Google redireciona para: `/~oauth?code=...` (processado pelo auth-bridge da Lovable)
- Auth-bridge processa, estabelece sessão, redireciona popup para: `window.location.origin`
- Popup agora está em `window.location.origin` — mesma origem que o app
- Podemos detectar isso via `message` event ou verificando se a popup está na mesma origem
- Recarregar a sessão no app com `window.location.reload()` ou `supabase.auth.getSession()`

### Implementação

**`src/components/auth/SocialLoginButtons.tsx`** — nova lógica:

```typescript
const handleOAuth = async (provider: "google" | "apple") => {
  setLoadingProvider(provider);
  try {
    const hostname = window.location.hostname;
    const isInIframe = window.self !== window.top;
    const isCustomDomain =
      !hostname.includes("lovable.app") &&
      !hostname.includes("lovableproject.com") &&
      !hostname.includes("localhost");

    if (isInIframe || isCustomDomain) {
      // Iframe (preview) ou domínio customizado: usar supabase direto + popup/redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) return;

      if (isInIframe) {
        // Dentro do iframe: abrir popup e aguardar postMessage de conclusão
        const popup = window.open(data.url, 'oauth', 'width=500,height=650,left=200,top=100');
        if (!popup) {
          toast({
            title: "Popup bloqueada",
            description: "Permita popups para este site e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Listener para detectar quando o oauth concluiu (popup voltou para a mesma origem)
        const messageHandler = (event: MessageEvent) => {
          if (event.origin === window.location.origin) {
            popup.close();
            window.removeEventListener('message', messageHandler);
            // Recarregar para detectar a nova sessão
            window.location.reload();
          }
        };
        window.addEventListener('message', messageHandler);

        // Fallback: monitorar se a popup fechou (o usuário fechou manualmente)
        const popupCheckInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheckInterval);
            window.removeEventListener('message', messageHandler);
            setLoadingProvider(null);
            // Tentar detectar sessão mesmo assim (caso popup fechou após autenticar)
            supabase.auth.getSession().then(({ data: sessionData }) => {
              if (sessionData.session) {
                window.location.reload();
              }
            });
          }
        }, 500);
      } else {
        // Domínio customizado: redirect direto
        window.location.href = data.url;
      }
    } else {
      // Preview top-level sem iframe: usar lovable.auth normal
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
  // Nota: setLoadingProvider(null) não é chamado no finally para o caso de popup/redirect
  // pois a página vai recarregar de qualquer forma
};
```

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/auth/SocialLoginButtons.tsx` | Adicionar detecção de iframe e fluxo de popup com fallback de polling |

### Matriz de comportamento final

| Ambiente | Detecção | Fluxo |
|---|---|---|
| Preview no editor (iframe) | `window.self !== window.top === true` | Popup + postMessage listener + polling fallback |
| App publicado em domínio customizado | `isCustomDomain === true` | Redirect direto via supabase |
| Preview standalone (top-level) | nenhuma das anteriores | `lovable.auth` (raro) |

### O que não muda

- Fluxo de email/senha inalterado
- Aparência dos botões idêntica
- No app publicado, o comportamento é exatamente igual ao já corrigido antes
