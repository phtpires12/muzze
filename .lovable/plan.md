
# Remover botoes sociais da tela inicial do onboarding

## Problema
A tela Welcome (Screen0Welcome) esta exibindo os botoes "Continuar com Google" e "Continuar com Apple" via o componente `SocialLoginButtons`, o que empurra todos os elementos para cima e desordena o layout. Essas opcoes sao redundantes aqui, pois o usuario que ja tem conta pode clicar em "Ja tem uma conta? Entrar" e ser redirecionado para `/auth`, onde tera acesso a todos os metodos de login.

## Solucao
Editar `src/components/onboarding/screens/phase1/Screen0Welcome.tsx`:

1. Remover o import do `SocialLoginButtons`
2. Remover o separador "ou" (divider com a linha horizontal)
3. Remover o componente `<SocialLoginButtons />`
4. Manter apenas o botao "Comecar" e o link "Ja tem uma conta? Entrar"

Resultado: a tela volta ao layout original limpo, com apenas dois elementos de acao no rodape.
