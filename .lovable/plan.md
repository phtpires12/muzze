

# Correcao definitiva: CSS Grid no header do card + width constraint

## Causa raiz real

No `CalendarDay.tsx`, linha 450-451:
```
className={cn(hasMultipleCards && "w-full flex-shrink-0")}
```

Quando ha apenas 1 conteudo no dia, o container do slide NAO recebe `w-full`. Isso significa que ele pode crescer livremente com o conteudo, e o `truncate` do titulo nunca ativa -- o botao de lixeira e empurrado para fora da area visivel e cortado pelo `overflow-hidden` do carousel.

Quando ha multiplos conteudos, `w-full flex-shrink-0` e aplicado, forcando o slide a ocupar 100% da largura, e ai o truncate funciona. Por isso a lixeira so aparece em cards com titulo curto ou em dias com multiplos conteudos.

## Solucao em 2 partes

### Parte 1: Sempre aplicar `w-full` no slide container

Trocar a linha 450-451 para SEMPRE aplicar `w-full`, independente de `hasMultipleCards`. O `flex-shrink-0` so e necessario para o carousel.

**Antes**: `cn(hasMultipleCards && "w-full flex-shrink-0")`
**Depois**: `cn("w-full", hasMultipleCards && "flex-shrink-0")`

### Parte 2: CSS Grid no header do card

Trocar o `flex items-start gap-1.5` (linha 463) por CSS Grid com 3 colunas:

```
grid grid-cols-[auto_1fr_auto] gap-1.5 items-start
```

- Coluna 1 (`auto`): emoji/icone
- Coluna 2 (`1fr`): titulo + badges, com `min-w-0` e `truncate`
- Coluna 3 (`auto`): botao de lixeira, sempre com espaco reservado

### Parte 3: Melhorar o botao de lixeira

- Adicionar `aria-label="Excluir conteudo"`
- Adicionar `min-w-[24px] min-h-[24px]` (area minima de toque, compactCard: `min-w-[20px] min-h-[20px]`)
- Adicionar `focus-within` visibility: `focus:opacity-100`
- Manter `z-10 pointer-events-auto`

## Arquivo afetado

`src/components/calendar/CalendarDay.tsx`

## Mudancas especificas

| Local | Antes | Depois |
|-------|-------|--------|
| Linha 450-451 | `cn(hasMultipleCards && "w-full flex-shrink-0")` | `cn("w-full", hasMultipleCards && "flex-shrink-0")` |
| Linha 463 | `flex items-start gap-1.5` | `grid grid-cols-[auto_1fr_auto] gap-1.5 items-start` |
| Linha 489-501 | button com flex-shrink-0, sem aria-label | button com z-10, pointer-events-auto, aria-label, min-w/h, focus:opacity-100 |

## Por que vai funcionar desta vez

1. `w-full` no slide garante que o card SEMPRE tem largura maxima definida pelo container pai
2. CSS Grid com `1fr` garante que a coluna do titulo NUNCA ultrapassa o espaco disponivel
3. A coluna `auto` da lixeira SEMPRE reserva espaco, independente do tamanho do titulo
4. O titulo trunca deterministicamente porque `1fr` + `min-w-0` + `truncate` funciona de forma previsivel no Grid
5. Nenhuma dependencia de absolute, padding-right ou overflow -- tudo e resolvido pelo layout do Grid

