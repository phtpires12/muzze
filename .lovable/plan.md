
# Tela 17 - Notificacoes

## O que sera construido
Uma tela de permissao de notificacoes, posicionada entre "Melhor horario pra criar" (CreationTime) e "App Antigo" (PreviousTools). Layout educacional sem barra de progresso (tela de transicao/acao, nao questionario).

## Posicao no fluxo
- **Phase 1, Screen 3** (nova tela)
- PreviousTools passa de Screen 3 para Screen 4
- `SCREENS_PER_PHASE` muda de `[10, 4, 3]` para `[10, 5, 3]`

## Layout da tela
- Fundo violet-50 (padrao do onboarding)
- Botao voltar (ChevronLeft) no header
- Titulo: "Podemos te mandar notificacoes nesse horario e/ou em outros?"
- Dois botoes de acao:
  - "Ativar notificacoes" (gradient-pill, chama `requestPermission` do hook `useNotifications`)
  - "Pular por enquanto" (ghost/outline, avanca sem ativar)
- Card informativo "Por que ativar notificacoes?" com 4 bullets:
  - Lembrete no horario que voce escolheu
  - Avisos de ofensivas em risco
  - Celebracao de conquistas e marcos
  - Voce pode desativar a qualquer momento

## Mudancas tecnicas

### 1. Novo componente: `src/components/onboarding/screens/phase1/Screen15Notifications.tsx`
- Props: `onContinue`, `onBack`
- Usa `useNotifications()` para chamar `requestPermission()`
- Ao clicar "Ativar", chama requestPermission e depois onContinue independente do resultado
- Ao clicar "Pular por enquanto", chama onContinue direto

### 2. `src/types/onboarding.ts`
- Atualizar `SCREENS_PER_PHASE` de `[10, 4, 3]` para `[10, 5, 3]`
- Atualizar comentarios

### 3. `src/pages/NewOnboarding.tsx`
- Importar `Screen15Notifications`
- Adicionar bloco para `phase === 1 && screen === 3` com a nova tela
- Mover o bloco existente de PreviousTools de `screen === 3` para `screen === 4`
- Atualizar `canContinue()`: phase 1 screen 3 retorna false (botoes internos), screen 4 requer selecao
