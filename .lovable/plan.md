
## Tela 18: "App Antigo" (Onde voce organizava seu conteudo?)

### Posicionamento no fluxo
A tela sera inserida logo apos "Crie sua conta" (Signup), como **Phase 2, Screen 1**.
As telas seguintes se deslocam:
- Paywall: Phase 2, Screen 1 → Screen 2
- Install: Phase 2, Screen 2 → Screen 3

`SCREENS_PER_PHASE` muda de `[10, 4, 3]` para `[10, 4, 4]`.

### Arquivos envolvidos

**1. Novo arquivo: `src/components/onboarding/screens/phase2/Screen15AppAntigo.tsx`**

- Layout violet-themed padrao do questionario (bg-violet-50, header com back + GradientProgressBar)
- Titulo personalizado: "{nome}, onde voce costumava organizar seu conteudo?"
- 7 opcoes multi-select usando o componente `QuestionnaireMultiSelect` (mesmo padrao visual das StickingPoints):
  - Notion, Trello, Click-Up, Obsidian, Cadernos, Monday, Outros
- Limite maximo de 3 selecoes — ao atingir 3, as opcoes nao selecionadas ficam desabilitadas visualmente
- Botao "Continuar" (gradient-pill) aparece somente quando pelo menos 1 opcao esta selecionada
- Props: `value`, `onChange`, `onContinue`, `onBack`, `progress`, `username`

**2. Editar: `src/types/onboarding.ts`**

- Adicionar campo `previous_tools?: string[]` ao `OnboardingData`
- Atualizar `SCREENS_PER_PHASE` de `[10, 4, 3]` para `[10, 4, 4]`
- Adicionar constante `PREVIOUS_TOOLS_OPTIONS` com as 7 opcoes
- Atualizar comentarios

**3. Editar: `src/pages/NewOnboarding.tsx`**

- Importar `Screen15AppAntigo`
- Adicionar bloco de renderizacao para `phase === 2 && screen === 1`
- Ajustar os blocos existentes: Paywall passa para `screen === 2`, Install para `screen === 3`
- Atualizar `canContinue()` para Phase 2: adicionar regra para screen 1 (`previous_tools?.length > 0`)
- Atualizar `renderScreen()` para os novos indices

### Detalhe tecnico: limite de 3 selecoes

O componente tera logica interna para desabilitar opcoes nao selecionadas quando `selected.length >= 3`. Isso sera implementado diretamente no componente, sem modificar o `QuestionnaireMultiSelect` compartilhado — o componente da tela fara o controle antes de passar ao multi-select, ou usara uma variante propria com suporte a `maxSelections`.
