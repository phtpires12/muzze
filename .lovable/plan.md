
# Remover botoes "Pular (Dev)" redundantes

## Contexto
Com a barra de navegacao dev (`DevNavigationBar`) presente em todas as telas, os botoes "Pular (Dev)" espalhados nas telas individuais sao completamente redundantes. A barra ja permite avancar, voltar e pular para qualquer tela.

## Mudancas

### 1. `src/components/onboarding/screens/phase6/Screen21Signup.tsx`
- Remover as props `showDevSkip` e `onDevSkip` da interface `Screen21SignupProps`
- Remover o bloco condicional que renderiza o botao "Pular (Dev)"
- Remover o import de `Shield` (se nao for mais usado)

### 2. `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`
- Remover as props `showDevSkip` e `onDevSkip` da interface `Screen25PaywallProps`
- Remover o bloco condicional do botao "Pular (Dev)" no header
- Simplificar o header (remover a logica ternaria que verifica `showDevSkip`)
- Remover o import de `Shield`

### 3. `src/pages/NewOnboarding.tsx`
- Remover `showDevSkip` e `onDevSkip` das chamadas de `Screen21Signup` e `Screen25Paywall`
- Remover o bloco do botao "Pular (Dev)" no final do `OnboardingLayout` (linhas ~575-586)
- Remover o import de `Shield` se nao for mais usado em nenhum outro lugar do arquivo (verificar os badges de dev que ainda usam)

Resultado: interface mais limpa, sem botoes duplicados. A navegacao dev fica centralizada na `DevNavigationBar`.
