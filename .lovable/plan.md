
## Limpar a tela Welcome do Onboarding

### Problema
A tela inicial (Screen0Welcome) exibe botões de login social (Google/Apple) que são redundantes, pois:
- O botao "Comecar" ja leva novos usuarios ao fluxo de cadastro
- O link "Ja tem uma conta? Entrar" redireciona para a pagina Auth, onde as opcoes de login social ja existem

Esses botoes extras empurram o layout para cima e poluem a tela.

### Mudanca

**Arquivo: `src/components/onboarding/screens/phase1/Screen0Welcome.tsx`**

- Remover o import do `SocialLoginButtons`
- Remover o bloco do separador "ou" e o componente `<SocialLoginButtons />`
- Manter apenas: botao "Comecar" e link "Ja tem uma conta? Entrar"

O resultado sera um layout mais limpo com mais espaco para o mockup do iPhone e o texto respirarem.
