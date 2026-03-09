

## Diagnóstico

### Problema 1: Crash "B.trim is not a function"
**Arquivo:** `src/pages/content/ContentViewPage.tsx`, linha 365
```typescript
const hasContent = Object.values(parsedContent).some(v => v && v.trim());
```
O conteúdo importado do Notion é salvo como um JSON array: `[{id, name, content}]`. A função `parseContent` faz `JSON.parse` e retorna esse array. `Object.values()` de um array retorna os elementos (objetos), e chamar `.trim()` em um objeto causa o crash fatal sem saída.

### Problema 2: Notificações massivas de conteúdo atrasado
O `useOverdueContent` busca **todos** os scripts com `publish_date < hoje` e status `planejado`. Os ~80 conteúdos importados do Notion vieram com datas passadas, gerando popup atrás de popup.

## Plano de Correção

### 1. Corrigir crash no ContentViewPage
Na linha 365, garantir que `.trim()` só é chamado em strings:
```typescript
const hasContent = Object.values(parsedContent).some(
  v => v && typeof v === 'string' && v.trim().length > 0
);
```

### 2. Adicionar coluna `notion_page_id` na tabela `scripts`
- Coluna `text`, nullable, default null
- Serve para identificar conteúdo importado do Notion
- Bonus: permite re-importações idempotentes no futuro

### 3. Adicionar coluna `date_manually_set` na tabela `scripts`
- Coluna `boolean`, default `true`
- Conteúdos criados pelo usuário: `true` (padrão)
- Conteúdos importados do Notion: `false`
- Quando o usuário muda a data manualmente (ContentViewPage, reschedule, etc.): `true`

### 4. Marcar conteúdo importado no NotionImportModal
Ao inserir scripts, incluir `notion_page_id: page.id` e `date_manually_set: false`.

### 5. Filtrar overdue para ignorar importações não editadas
No `useOverdueContent`, adicionar filtro:
```typescript
// Excluir conteúdos importados cuja data não foi alterada pelo usuário
.or('notion_page_id.is.null,date_manually_set.eq.true')
```
Assim, conteúdo importado do Notion só gera popup se o usuário manualmente definiu uma nova data.

### 6. Setar `date_manually_set = true` ao alterar data
No `ContentViewPage.handleDateChange` e no `useOverdueContent.reschedule`, incluir `date_manually_set: true` no update.

### Resumo dos arquivos alterados
- `src/pages/content/ContentViewPage.tsx` — fix crash + set flag on date change
- `src/components/content/NotionImportModal.tsx` — add notion_page_id + date_manually_set
- `src/core/hooks/useOverdueContent.ts` — filter imported content
- Migration SQL — add 2 columns to scripts

