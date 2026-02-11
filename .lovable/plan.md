

# Refinamento visual dos cards do calendario - Estilo Notion/Linear

## Resumo

Tornar os cards do calendario mais limpos e premium: botao de excluir menor e absoluto (sem ocupar espaco no grid), titulo ocupando 100% da largura, tooltip com titulo completo, e padding otimizado.

## Mudancas tecnicas

**Arquivo**: `src/components/calendar/CalendarDay.tsx`

### 1. Voltar o layout do header para flex (removendo grid)

O grid atual reserva uma coluna fixa para a lixeira, reduzindo a largura util do titulo. A solucao e voltar para `flex` no header, mas com o botao em `position: absolute` dentro do card (`relative`). Como o card agora tem `w-full` garantido (correcao anterior), o truncate funciona corretamente.

```
Antes:  grid grid-cols-[auto_1fr_auto] -> titulo perde espaco para coluna da lixeira
Depois: flex items-start gap-1.5       -> titulo ocupa 100%, lixeira absoluta por cima
```

### 2. Botao de excluir - absoluto, menor, sem fundo

- Posicao: `absolute top-1 right-1` (compactCard: `top-0.5 right-0.5`)
- Icone: `w-3.5 h-3.5` (14px) para normal, `w-3 h-3` (12px) para compact
- Fundo: transparente por padrao, `hover:bg-destructive/15` apenas no hover
- Cor do icone: `text-muted-foreground/60` por padrao, `hover:text-destructive` no hover
- Area clicavel: `p-1` (proporcional, sem min-w/min-h fixos grandes)
- Visibilidade: `opacity-0 group-hover/card:opacity-100 focus:opacity-100`
- Transicao: `transition-all duration-150` (fade-in suave)
- `z-10 pointer-events-auto`

### 3. Titulo - 100% da largura com tooltip

- Container do titulo volta para `flex-1 min-w-0` (sem coluna grid)
- Texto com `truncate` (reticencias quando necessario)
- Envolver o titulo em `Tooltip` do Radix para mostrar titulo completo no hover
- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`

### 4. Padding otimizado

- Card normal: manter `p-2` mas adicionar `pr-6` para dar espaco ao botao absoluto sem cortar
- Card compact: manter `p-1.5` mas adicionar `pr-5`
- Isso garante que o titulo trunca ANTES de chegar na area do botao

### 5. Importacoes

Adicionar import do Tooltip:
```typescript
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
```

## Estrutura final do card

```
div.group/card.relative (card com borda e background)
  div.p-2.pr-6 (padding interno, pr-6 reserva espaco visual)
    div.flex.items-start.gap-1.5
      [emoji]
      div.flex-1.min-w-0
        Tooltip -> titulo truncado (mostra completo no hover)
        badges
  button.absolute.top-1.right-1 (lixeira, opacity-0, aparece no hover)
```

## Por que funciona

- `w-full` no slide container (ja implementado) garante largura maxima
- `flex-1 min-w-0` + `truncate` no titulo funciona porque o container tem largura definida
- `pr-6` no padding interno garante que o texto nunca vai ate o canto onde o botao absoluto fica
- O botao absoluto esta DENTRO do card `relative`, entao nao e cortado pelo overflow do carousel
- Sem grid, o titulo usa 100% do espaco disponivel (descontando emoji e padding)
