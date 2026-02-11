

# Navegacao Dev no Onboarding

## Problema
Voce esta preso na tela 25 (Paywall) porque nao ha botao de voltar visivel, mesmo que a prop `onBack` seja passada para o componente.

## Solucao
Adicionar uma **barra de navegacao flutuante para devs** (fixed bottom) que aparece em TODAS as telas do onboarding quando o usuario e developer ou admin. Essa barra permite:

1. **Voltar** (seta esquerda) - chama `prevScreen()`
2. **Avancar** (seta direita) - chama `nextScreen()`
3. **Indicador de posicao** - mostra "Fase X / Tela Y" para saber onde esta
4. **Pular para qualquer tela** - campo numerico para digitar fase e tela diretamente

## Mudancas tecnicas

### 1. `src/pages/NewOnboarding.tsx`
- Adicionar um componente inline `DevNavigationBar` que renderiza uma barra fixa no rodape (fixed bottom-0, z-[60]) com:
  - Botoes de seta esquerda/direita para `prevScreen`/`nextScreen`
  - Texto central mostrando `P{phase} S{screen}`
  - Botao para abrir um mini-painel com inputs numericos para pular direto para fase/tela especifica via `goToScreen(phase, screen)`
- Renderizar esse componente FORA de todos os blocos condicionais, como ultimo elemento do return, apenas quando `isDeveloper || isAdmin`
- Isso garante que a barra apareca em TODAS as telas, incluindo Paywall, Signup, Install, etc.

### 2. Nenhuma mudanca nos componentes de tela individuais
- Os componentes como `Screen25Paywall`, `Screen21Signup`, etc. nao precisam de alteracao
- A barra de dev e renderizada no nivel da pagina (`NewOnboarding`), sobrepondo qualquer tela

## Visual
A barra sera compacta, semi-transparente (backdrop-blur), com estilo similar ao badge de dev ja existente (bg-primary/10, border-primary/20), posicionada no rodape para nao interferir com o conteudo.

