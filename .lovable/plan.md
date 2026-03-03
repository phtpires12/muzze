

## Plano: Integração Completa do Workflow Carrossel no Preview e Kanban

### Problema Atual (baseado nos screenshots)

1. **ContentViewPage (Preview)**: O dropdown de status mostra Ideação, Roteiro, Revisão, **Gravação**, **Edição** para um conteúdo "Carrossel" — deveria mostrar apenas Ideação, Roteiro, Revisão, **Design**.
2. **ProductionBoardView (Kanban)**: O "Teste Carrossel" aparece na coluna Roteiro ao lado de conteúdos normais, mas as colunas Gravação/Edição existem e aceitam drag — não deveriam ser alvos válidos para carrosséis.

### Análise Técnica

O código **já tem** o template `carousel` definido em `workflow-templates.ts` e a detecção `content_type === 'Carrossel'` em `ContentViewPage` e `ProductionBoardView`. Os `allowedColumns` já são filtrados pelo workflow. O que precisa ser verificado e corrigido:

---

### Mudança 1 — Validação de drag no Kanban por conteúdo individual

**Arquivo**: `src/components/calendar/ProductionBoardView.tsx`

**Problema**: O `handleDragEnd` permite arrastar qualquer script para qualquer coluna visível. Se o board mostra colunas extras (porque outros scripts as precisam), um carrossel pode ser arrastado para "Gravação".

**Solução**: No `handleDragEnd`, antes de aceitar o drop, verificar se a coluna de destino pertence ao workflow do script que está sendo arrastado:

```typescript
// Dentro de handleDragEnd, após validar targetColumnId
const draggedScript = localScripts.find(s => s.id === scriptId);
if (draggedScript) {
  const scriptWorkflowId = draggedScript.content_type === 'Carrossel' 
    ? 'carousel' 
    : (draggedScript.workflow_template || currentTemplate.id);
  const scriptTemplate = getWorkflowTemplate(scriptWorkflowId as WorkflowTemplateId);
  
  if (!scriptTemplate.stages.includes(targetColumnId as CreativeStage)) {
    toast({
      title: "Movimento não permitido",
      description: `Conteúdos com workflow "${scriptTemplate.name}" não passam pela etapa "${targetColumn?.label}".`,
      variant: "destructive",
    });
    return;
  }
}
```

Isso bloqueia o drag de um carrossel para "Gravação" ou "Edição", mostrando uma mensagem explicativa.

---

### Mudança 2 — Confirmar que o ContentViewPage filtra corretamente

**Arquivo**: `src/pages/content/ContentViewPage.tsx`

A lógica nas linhas 154-158 já existe e parece correta:

```typescript
const workflowProps = useWorkflowTemplate({
  scriptWorkflow: script?.content_type === 'Carrossel'
    ? 'carousel'
    : (script?.workflow_template as WorkflowTemplateId) || null
});
```

E `allowedColumns` na linha 160-162 já usa `workflowProps.getOrderedKanbanColumns()`.

**Possível bug**: Se `script` é `null` no primeiro render, `workflowProps` usa o template global. Quando `script` carrega, o `useMemo` deveria recalcular. Mas se `getOrderedKanbanColumns` não está refletindo a mudança, pode ser que o `useWorkflowTemplate` esteja memoizando o valor antigo.

**Ação**: Verificar se o `useWorkflowTemplate` recalcula quando `scriptWorkflow` muda de `null` para `'carousel'`. Se necessário, forçar a dependência no `useMemo`:

```typescript
const allowedColumns = useMemo(() => {
  return workflowProps.getOrderedKanbanColumns();
}, [workflowProps.stages]); // usar stages diretamente, não o objeto inteiro
```

---

### Mudança 3 — Badge visual no Kanban card indicando workflow diferente

**Arquivo**: `src/components/calendar/ProductionKanbanCard.tsx`

Isso **já funciona** (linhas 57-62, 117-124). O card do carrossel já mostra o badge "📱 Carrossel". Nenhuma mudança necessária aqui.

---

### Mudança 4 — Indicador visual de restrição de drop no Kanban

**Arquivo**: `src/components/calendar/ProductionKanbanColumn.tsx`

**Melhoria UX**: Quando o usuário está arrastando um carrossel, as colunas "Gravação" e "Edição" poderiam ficar visualmente desabilitadas (opacidade reduzida, borda vermelha). Isso requer:

1. Passar o `activeId` e o script sendo arrastado como contexto
2. Na coluna, verificar se o script ativo pertence a um workflow que inclui aquela coluna
3. Aplicar classes CSS condicionais (`opacity-30`, `border-dashed border-red-500/30`)

**Implementação**: Adicionar prop `isDropDisabled` à `ProductionKanbanColumn` e calcular no `ProductionBoardView`:

```typescript
// No ProductionBoardView, ao renderizar colunas:
const activeScriptWorkflow = activeScript 
  ? getWorkflowTemplate(
      activeScript.content_type === 'Carrossel' ? 'carousel' 
      : (activeScript.workflow_template || currentTemplate.id) as WorkflowTemplateId
    )
  : null;

// Na renderização:
<ProductionKanbanColumn
  key={column.id}
  column={column}
  scripts={columnScripts}
  isDropDisabled={activeScriptWorkflow ? !activeScriptWorkflow.stages.includes(column.id) : false}
  onViewScript={onViewScript}
  onDeleteScript={onDeleteScript}
/>
```

---

### Resumo de Arquivos

| Arquivo | Mudança | Complexidade |
|---|---|---|
| `src/components/calendar/ProductionBoardView.tsx` | Validar workflow do script no `handleDragEnd` + calcular `isDropDisabled` para cada coluna | Média |
| `src/components/calendar/ProductionKanbanColumn.tsx` | Adicionar prop `isDropDisabled` com feedback visual (opacity, borda) | Baixa |
| `src/pages/content/ContentViewPage.tsx` | Corrigir dependência do `useMemo` para `allowedColumns` reagir à mudança de workflow | Baixa |

### O que NÃO muda

- Template `carousel` em `workflow-templates.ts` (já existe)
- Detecção `content_type === 'Carrossel'` (já implementada nos 3 arquivos relevantes)
- `ProductionKanbanCard.tsx` (badge de workflow já funciona)
- Fluxo de criação de conteúdo (já salva workflow_template automaticamente)

### Fluxo esperado após implementação

```text
Usuário abre Preview de "Teste Carrossel":
  → Dropdown mostra: Ideação, Roteiro, Revisão, Design ✓

Usuário no Kanban arrasta "Teste Carrossel" para Gravação:
  → Colunas Gravação/Edição ficam semi-transparentes durante drag ✓
  → Se soltar: toast "Conteúdos com workflow Carrossel não passam pela etapa Gravação" ✓

Usuário no Kanban arrasta "Teste Carrossel" para Revisão:
  → Funciona normalmente ✓
```

