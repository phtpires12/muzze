
# Remover limite de scripts no carrossel do calendario

## Problema

O carrossel dentro de cada dia do calendario limita a exibicao a `maxScripts` (4 normal, 2 compact). Scripts alem desse limite ficam escondidos atras de um indicador "+N mais" que nao e clicavel. Isso impede o usuario de navegar por todos os seus conteudos.

## Solucao

Remover o conceito de `maxScripts` por completo. O carrossel deve iterar por TODOS os scripts do dia, sem corte.

## Mudancas no arquivo `src/components/calendar/CalendarDay.tsx`

### 1. Remover a constante `maxScripts` (linha 190)

Excluir `const maxScripts = compactCard ? 2 : 4;` -- ela nao sera mais usada.

### 2. Substituir todas as referencias a `maxScripts`

| Local | Antes | Depois |
|-------|-------|--------|
| Linha 222 | `Math.min(scripts.length, maxScripts) - 1` | `scripts.length - 1` |
| Linha 232 | dep array com `maxScripts` | remover da dep array |
| Linha 396 | `scripts.slice(0, maxScripts).map` | `scripts.map` |
| Linha 414 | `Math.min(scripts.length, maxScripts)` | `scripts.length` |
| Linha 444 | `scripts.slice(0, maxScripts).map` | `scripts.map` |
| Linha 540 | `Math.min(scripts.length, maxScripts) - 1` | `scripts.length - 1` |

### 3. Remover o indicador "+N mais" (linhas 556-560)

Esse bloco inteiro sera removido, ja que nao havera mais scripts escondidos.

### 4. Dots de navegacao: limitar visualmente se muitos

Para evitar que 15 dots ocupem espaco demais, quando houver mais de 6 scripts, os dots serao substituidos apenas pelo contador numerico ("3/15"). Abaixo de 6, os dots continuam normais.

## Resultado esperado

- O carrossel passa por todos os scripts do dia, sem corte
- Nenhuma mensagem "+N mais" aparece
- A navegacao (setas, dots/contador, autoplay) funciona para qualquer quantidade
- Layout permanece limpo mesmo com muitos conteudos
