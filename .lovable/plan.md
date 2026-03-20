

## Adicionar filtro de tipo de conteúdo na view de Quadro

Atualmente, os filtros de tipo de conteúdo (`contentTypeFilter`) e etapa (`stageFilter`) só aparecem na view de calendário. A view de quadro (linhas 865-916) não tem nenhum filtro — passa `scripts` direto para `ProductionBoardView` e `PublicationBoardView`.

### Mudança em `src/pages/calendario/CalendarioEditorialPage.tsx`

1. **Adicionar filtro inline na área do quadro** (ao lado do seletor Produção/Publicação, linha 868-896): incluir um `Select` de tipo de conteúdo com as mesmas opções (Todos, Reels, YouTube, TikTok, Carrossel, Anúncio). Reutilizar o state `contentTypeFilter` que já existe.

2. **Filtrar os scripts antes de passar aos componentes**: nas linhas 900-913, em vez de passar `scripts` diretamente, passar uma lista filtrada:
```typescript
const boardFilteredScripts = contentTypeFilter === "all"
  ? scripts
  : scripts.filter(s => s.content_type === contentTypeFilter);
```

3. **Mover o estado de filtros para escopo global** — como `contentTypeFilter` já é um state do componente principal (linha 70), basta usá-lo. O filtro persiste ao alternar entre calendar e board.

### Resultado
- Um dropdown compacto "Tipo de conteúdo" aparece na barra do quadro
- Filtra os cards em ambos os sub-views (Produção e Publicação)
- Funciona em desktop e mobile

