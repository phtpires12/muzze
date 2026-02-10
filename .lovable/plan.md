

# Login com Google e Apple no Onboarding

## Resumo

Adicionar botoes de "Entrar com Google" e "Entrar com Apple" em 3 lugares:
1. **Tela de Welcome (mobile)** - Screen0Welcome
2. **Tela de Signup (mobile)** - Screen21Signup
3. **Tela de Signup (desktop)** - DesktopOnboarding
4. **Pagina de Login** - Auth.tsx

## O que precisa acontecer

### Passo 1 - Configurar OAuth no Lovable Cloud

Usar a ferramenta `configure-social-auth` para ativar Google e Apple. Isso gera automaticamente o modulo `src/integrations/lovable/` com a funcao `lovable.auth.signInWithOAuth()`.

### Passo 2 - Criar componente reutilizavel `SocialLoginButtons`

Um componente simples com dois botoes (Google e Apple) que pode ser reaproveitado em todas as telas.

```
src/components/auth/SocialLoginButtons.tsx
```

- Botao "Continuar com Google" com icone do Google
- Botao "Continuar com Apple" com icone da Apple
- Separador visual "ou" entre os botoes sociais e o formulario de email/senha
- Tratamento de erro com toast em portugues
- Apos login social bem-sucedido: verificar se o perfil ja existe e redirecionar adequadamente

### Passo 3 - Integrar nas telas

#### Screen0Welcome (mobile)
- Adicionar os botoes sociais abaixo do botao "Comecar"
- Manter o fluxo atual: quem usa login social pula direto para a home (se ja tem perfil completo) ou vai para a tela de username (se e novo)

#### Screen21Signup (mobile)
- Adicionar os botoes sociais acima do formulario de email/senha
- Separador "ou continue com email"

#### DesktopOnboarding (step 'signup')
- Adicionar os botoes sociais acima do formulario de email/senha

#### Auth.tsx (pagina de login)
- Adicionar os botoes sociais acima do formulario de login

### Passo 4 - Logica pos-login social

Quando o usuario faz login via Google/Apple:
- Se e um usuario novo: o trigger `handle_new_user` ja cria o perfil automaticamente. Redirecionar para o onboarding na tela de username para completar os dados.
- Se e um usuario existente com `first_login = false`: redirecionar para a home.
- Se e um usuario existente com `first_login = true`: redirecionar para o onboarding.

## Detalhes tecnicos

### Chamada de OAuth

```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleLogin = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (error) { /* toast de erro */ }
};

const handleAppleLogin = async () => {
  const { error } = await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });
  if (error) { /* toast de erro */ }
};
```

### Fluxo de redirecionamento

Apos o OAuth, o usuario retorna para a raiz (`/`). O `App.tsx` ja verifica a sessao e redireciona conforme o estado do perfil:
- `first_login = true` -> onboarding
- `first_login = false` -> home

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| (auto-gerado) `src/integrations/lovable/` | Modulo de auth social (gerado pela ferramenta) |
| (novo) `src/components/auth/SocialLoginButtons.tsx` | Componente reutilizavel com botoes Google + Apple |
| `src/components/onboarding/screens/phase1/Screen0Welcome.tsx` | Adicionar botoes sociais |
| `src/components/onboarding/screens/phase6/Screen21Signup.tsx` | Adicionar botoes sociais acima do form |
| `src/components/onboarding/DesktopOnboarding.tsx` | Adicionar botoes sociais no step signup |
| `src/pages/Auth.tsx` | Adicionar botoes sociais acima do form de login |

