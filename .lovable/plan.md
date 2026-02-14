

## Correcoes no carrossel de continuidade da Home

### Problemas identificados

**1. Conteudo ja publicado aparecendo no carrossel**
As queries "recent" e "stalled" nao filtram conteudos com `publish_status = "postado"`. Resultado: conteudos ja publicados (como "Esposa Submissa") aparecem sugerindo que o usuario "retome a criacao".

**2. "-1 dias para publicar" em vez de "Publique hoje"**
Bug de timezone na conversao de `publish_date`. Quando o codigo faz `new Date("2026-02-14")`, o JavaScript cria a data em UTC meia-noite. No fuso do Brasil (UTC-3), isso vira 13/02 as 21h. O `differenceInDays` calcula entre essa data (dia 13 local) e hoje (dia 14 local), resultando em -1.

**3. Conteudo para publicar hoje deveria vir primeiro**
Quando existe um conteudo com publicacao para hoje, ele e mais urgente que a "ultima atividade". O carrossel deveria inverter a ordem, mostrando primeiro o slide de urgencia.

### Solucao

**Arquivo alterado: `src/hooks/useContinuityOptions.ts`**

**Correcao 1 -- Filtrar conteudo publicado**
- Na query "recent" (linha 72): adicionar `.neq("publish_status", "postado")`
- Na query "stalled" (linha 140): adicionar `.neq("publish_status", "postado")`

**Correcao 2 -- Timezone no calculo de dias**
- Trocar `new Date(script.publish_date)` por `new Date(script.publish_date + "T00:00:00")` na linha 109
- Isso forca o JavaScript a interpretar a data no fuso local do usuario, nao em UTC
- O calculo de `differenceInDays` passara a retornar 0 para "hoje", 1 para "amanha", etc.

**Correcao 3 -- Reordenar quando ha publicacao para hoje**
- Apos montar a lista `results`, verificar se existe algum item do tipo "expiring" com `daysUntilPublish === 0`
- Se sim, mover esse item para a posicao 0 do array (primeiro slide do carrossel)
- Na pratica: ordenar o array colocando "expiring com urgencia hoje" em primeiro lugar

O codigo de reordenacao ficaria assim:

```typescript
// Reordenar: publicacao para hoje vem primeiro
const todayExpiringIndex = results.findIndex(
  r => r.type === "expiring" && r.urgencyBadge?.label === "Publicar hoje!"
);
if (todayExpiringIndex > 0) {
  const [todayItem] = results.splice(todayExpiringIndex, 1);
  results.unshift(todayItem);
}
```

### Resultado esperado

- Conteudos ja postados nao aparecem mais no carrossel
- Conteudo com publicacao para hoje mostra "Publicar hoje!" (nao "-1 dias")
- Quando ha publicacao para hoje, esse slide aparece primeiro no carrossel
