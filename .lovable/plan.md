
# Correcao definitiva: truncar titulos + lixeira visivel

## Causa raiz identificada

O botao de lixeira esta posicionado com `absolute` dentro do card, mas o card esta dentro de um container com `overflow: hidden` (necessario para o carousel). Como o card ocupa 100% da largura, o botao no `right-1` fica dentro dos limites do card, porem o titulo longo empurra o conteudo e a area do botao fica visualmente sobreposta pelo texto truncado via CSS `truncate` -- mas o botao em si fica invisivel porque o `overflow-hidden` do container pai corta qualquer conteudo que extrapole.

O verdadeiro problema: o `truncate` do titulo funciona, mas o `pr-5` adicionado nao esta criando espaco real porque o `overflow-hidden` do container do carousel esta cortando tudo no limite da celula.

## Solucao

Remover o `overflow-hidden` do container do carousel para cards unicos (quando nao ha carousel) e, para todos os casos, garantir que o botao de lixeira fique DENTRO do fluxo visual do card usando `overflow-visible` no card em si.

Abordagem concreta em duas partes:

### Parte 1: Garantir overflow visivel no card

O card (`div` com `group/card relative`) precisa ter `overflow-visible` (que ja e o padrao). O problema e o container pai `overflow-hidden`. A solucao e aplicar `overflow-hidden` apenas no eixo X do track do carousel (para o slide funcionar), mas permitir que os cards internos mostrem seus elementos absolutos.

Na pratica, trocar `overflow-hidden` por `overflow-x-hidden overflow-y-visible` nao funciona bem. A alternativa mais robusta:

**Mover o botao de lixeira para FORA do carousel `overflow-hidden`, posicionando-o como overlay no container `relative` pai.**

### Parte 2: Truncar todos os titulos igualmente

Aplicar truncamento com reticencias em todos os titulos, nao apenas quando ha multiplos cards. O titulo ja usa `truncate` do Tailwind, que adiciona `text-overflow: ellipsis`. O padding-right (`pr-5`/`pr-4`) garante espaco para a lixeira. Isso ja esta implementado, mas nao funciona por causa do overflow do carousel.

## Mudanca tecnica final

**Arquivo**: `src/components/calendar/CalendarDay.tsx`

### Estrategia: Clip apenas no eixo horizontal

Trocar o container `overflow-hidden` (linha 435) por `overflow-x-clip` que corta apenas no eixo X (necessario para o carousel) mas permite que elementos com `position: absolute` dentro dos cards sejam visiveis verticalmente. Porem, como a lixeira esta no eixo X (right), isso tambem nao resolve.

### Estrategia definitiva: Padding interno no card

A solucao real e garantir que o botao de lixeira fique DENTRO da area visivel do card, nao no limite. Isso se faz:

1. Remover `pr-5`/`pr-4` do container do titulo (linha 467)
2. Mover a lixeira para ser um elemento INLINE no final do flex row, mas com `position: relative` e nao `absolute`
3. Usar `flex-shrink-0` na lixeira e dar ao titulo container `min-w-0` + `truncate` (que ja tem)
4. O titulo sera truncado automaticamente pelo flex layout, deixando espaco para a lixeira

```
Layout final:
[emoji] [titulo truncado com...] [lixeira]
         ^-- flex-1 min-w-0       ^-- flex-shrink-0, sempre visivel
```

A diferenca da tentativa anterior (que falhou) e que desta vez o botao NAO tera `flex-shrink-0` dentro de um container com `overflow-hidden`. Ele ficara dentro do `flex` row principal do card, que TEM espaco garantido pelo `min-w-0` + `truncate` no titulo.

O problema anterior era que a lixeira estava dentro do `div.flex-1.min-w-0.overflow-hidden` -- o container do titulo. Desta vez, ela fica FORA desse container, como irmao direto no flex row `div.flex.items-start.gap-1.5`:

```
div.flex.items-start.gap-1.5
  [emoji] flex-shrink-0
  div.flex-1.min-w-0 (SEM overflow-hidden)
    titulo (truncate)
    badges
  button.flex-shrink-0 (lixeira, opacity no hover)
```

A chave e remover `overflow-hidden` do container do titulo (linha 467). O `truncate` no titulo ja cuida de esconder texto excedente sem precisar de `overflow-hidden` no container pai. E sem `overflow-hidden` no container pai, o flex layout consegue calcular corretamente o espaco para a lixeira.

## Resumo das mudancas

| Linha | Antes | Depois |
|-------|-------|--------|
| 467 | `flex-1 min-w-0 overflow-hidden pr-4/pr-5` | `flex-1 min-w-0` (sem overflow-hidden, sem pr) |
| 491-503 | `button` com `absolute z-10 top-1 right-1` | `button` inline com `flex-shrink-0 ml-auto`, sem position absolute |
| 463 | `flex items-start gap-1.5` | Sem mudanca |

O botao de lixeira sai de absolute e volta para inline, mas desta vez no nivel correto do flex (como irmao do container do titulo, nao dentro dele).
