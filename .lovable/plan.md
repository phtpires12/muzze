
# Correcao definitiva do icone de lixeira nos cards do calendario

## Problema identificado

O botao de lixeira foi movido para inline dentro do flex layout do card na ultima alteracao. Porem, o container do titulo tem `flex-1 min-w-0 overflow-hidden` (linha 467), e quando o titulo e longo, o layout flex nao deixa espaco suficiente para o botao mesmo com `flex-shrink-0`. O `overflow-hidden` no container pai do titulo, combinado com o espaco limitado das celulas do calendario, faz com que o botao desapareca visualmente.

## Solucao

Reposicionar o botao de lixeira como `absolute` dentro do card (que ja tem `position: relative`), mas desta vez posicionado DENTRO da area de padding do card, nao fora dele. Isso garante que:

1. O botao nunca e afetado pelo layout flex ou overflow do conteudo
2. O botao fica sempre no canto superior direito do card, sobre o conteudo
3. O hover do `group/card` continua funcionando normalmente
4. O botao nao e cortado pelo `overflow: hidden` do carousel, pois esta dentro dos limites do card

## Mudanca tecnica

**Arquivo**: `src/components/calendar/CalendarDay.tsx`

### Antes (atual - problematico)
```
div.flex.items-start.gap-1.5
  emoji (flex-shrink-0)
  div.flex-1.min-w-0.overflow-hidden (titulo + badges)
  button.flex-shrink-0 (lixeira) <-- cortado pelo layout
```

### Depois (corrigido)
```
div.flex.items-start.gap-1.5
  emoji (flex-shrink-0)
  div.flex-1.min-w-0.overflow-hidden (titulo + badges, com padding-right para nao sobrepor)
button.absolute.top-1.right-1 (lixeira) <-- posicao absoluta DENTRO do card
```

Detalhes:
- Mover o `<button>` de lixeira para FORA do `div.flex.items-start.gap-1.5`, mas ainda DENTRO do card `div` que tem `relative`
- Posicionar com `absolute top-1 right-1` (ou `top-0.5 right-0.5` para compactCard)
- Adicionar `pr-5` (ou `pr-4` para compactCard) no container do titulo para evitar sobreposicao visual
- Manter `opacity-0 group-hover/card:opacity-100` e `z-10` para ficar acima do conteudo

Isso e diferente da abordagem original que falhava porque o botao estava fora dos limites do card e era cortado pelo `overflow: hidden` do carousel. Agora ele fica dentro do card, dentro do padding, e nao depende do flex layout.
