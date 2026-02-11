
## Tela 16: Ativar Notificacoes

### Onde ela entra
Atualmente a estrutura e: Phase 0 (10 telas), Phase 1 (3 telas), Phase 2 (3 telas).
A nova tela sera inserida como **Phase 1, Screen 3** -- logo apos CreationTime (Phase 1, Screen 2).

`SCREENS_PER_PHASE` muda de `[10, 3, 3]` para `[10, 4, 3]`.

### Arquivos envolvidos

**1. Novo arquivo: `src/components/onboarding/screens/phase1/Screen14Notifications.tsx`**

- Layout segue o padrao violet-themed das outras telas do questionario (bg-violet-50, header com back + GradientProgressBar)
- Titulo: "Podemos te mandar notificacoes nesse horario e/ou em outros?"
- Botao principal: "Ativar notificacoes" (gradient-pill) -- chama `requestPermission()` do hook `useNotifications`, e ao concluir (sucesso ou falha) avanca com `onContinue`
- Botao secundario: "Pular por enquanto" (ghost) -- avanca com `onContinue` sem pedir permissao
- Card informativo "Por que ativar notificacoes?" com os 4 bullets:
  - Lembrete no horario que voce escolheu
  - Avisos de ofensivas em risco
  - Celebracao de conquistas e marcos
  - Voce pode desativar a qualquer momento
- Props: `onContinue`, `onBack`, `progress`, `username`

**2. Editar: `src/types/onboarding.ts`**

- `SCREENS_PER_PHASE` de `[10, 3, 3]` para `[10, 4, 3]`
- Atualizar comentarios da Phase 1 para refletir 4 telas

**3. Editar: `src/pages/NewOnboarding.tsx`**

- Importar `Screen14Notifications`
- Adicionar bloco de renderizacao para `phase === 1 && screen === 3` (mesmo padrao das outras telas: Developer Badge + devNav + componente)
- Atualizar `canContinue()` para Phase 1 screen 3: retornar `false` (botoes internos controlam navegacao)

### Detalhes tecnicos

- O hook `useNotifications` ja esta importado no `NewOnboarding.tsx` (linha 6) e `requestPermission` ja esta disponivel (linha 36)
- A funcao `requestPermission` sera passada como prop para o novo componente, ou chamada diretamente dentro dele via import do hook
- O componente usara `framer-motion` para animacoes de entrada, consistente com as outras telas
- Icones dos bullets usarao emojis ou icones Lucide (Bell, Shield, Trophy, Settings) para manter consistencia visual
