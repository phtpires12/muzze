

# Plano 5 (Reformulado): Limpar Código Morto - Remoção Completa do Sistema Antigo de Bolinhas

## Contexto

A Mesa de Edição está sendo reformulada do zero. O sistema antigo de 6 etapas de edição (Decupagem, Música, Efeitos Sonoros, etc.) com timers individuais e bolinhas de progresso **não faz mais parte do novo design**. 

A nova fonte da verdade é simples:
- **Editado** = clicou em "Marcar como Editado"
- **Não Editado** = não clicou

## O Que Será Removido

### 1. Arquivo a Deletar

| Arquivo | Motivo |
|---------|--------|
| `src/components/editing/EditingNotesPanel.tsx` | Não é usado em nenhum lugar |

### 2. Componente a Manter (por enquanto)

| Arquivo | Situação |
|---------|----------|
| `src/components/EditingChecklist.tsx` | Usado em `Session.tsx` - remover requer refatorar Session.tsx também |

**Decisão**: Manter o `EditingChecklist.tsx` por ora, já que ele está acoplado à página `Session.tsx`. A limpeza total da `Session.tsx` pode ser um projeto futuro separado.

### 3. Remover Bolinhas do Kanban

O impacto principal é no **Calendário Editorial** - remover as 6 bolinhas que aparecem nos cards da coluna "Edição".

**Arquivos afetados:**

| Arquivo | Alteração |
|---------|-----------|
| `src/components/calendar/ProductionKanbanCard.tsx` | Remover prop `showEditingProgress`, remover import `EDITING_STEP_IDS`, remover seção das bolinhas |
| `src/components/calendar/ProductionKanbanColumn.tsx` | Remover `editing_progress` da interface Script, remover prop `showEditingProgress={column.id === 'editing'}` |
| `src/components/calendar/ProductionBoardView.tsx` | Remover `editing_progress` da interface Script |
| `src/components/calendar/OrphanColumn.tsx` | Remover `editing_progress` da interface, remover import `EDITING_STEP_IDS` não utilizado |
| `src/pages/CalendarioEditorial.tsx` | Remover `editing_progress` da interface |

### 4. Limpar kanban-columns.ts

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/kanban-columns.ts` | Remover export `EDITING_STEP_IDS` |

### 5. Limpar EditingWorkspace.tsx

| Código a Remover | Motivo |
|------------------|--------|
| `editing_notes` da interface `ScriptData` | Campo não é mais usado |
| `editing_notes` no setScript | Não é exibido |
| Import `cn` de @/lib/utils | Não é utilizado |
| Import `getStageLabel` | Não é utilizado |

## Alterações Técnicas Detalhadas

### ProductionKanbanCard.tsx

**Antes:**
```tsx
import { EDITING_STEP_IDS } from "@/lib/kanban-columns";

interface Script {
  editing_progress?: string[] | null;  // REMOVER
}

interface ProductionKanbanCardProps {
  showEditingProgress?: boolean;  // REMOVER
}

// Dentro do componente:
const progressCount = script.editing_progress?.length || 0;  // REMOVER
const totalSteps = EDITING_STEP_IDS.length;  // REMOVER

{showEditingProgress && (  // REMOVER SEÇÃO INTEIRA
  <div className="flex items-center gap-0.5 mt-2">
    {EDITING_STEP_IDS.map(stepId => (...))}
  </div>
)}
```

**Depois:**
```tsx
// Sem import de EDITING_STEP_IDS
// Sem editing_progress na interface
// Sem showEditingProgress na props
// Sem seção de bolinhas
```

### ProductionKanbanColumn.tsx

**Antes:**
```tsx
interface Script {
  editing_progress?: string[] | null;  // REMOVER
}

<ProductionKanbanCard
  showEditingProgress={column.id === 'editing'}  // REMOVER
/>
```

### kanban-columns.ts

```tsx
// REMOVER estas linhas (91-99):
// === IDs DAS ETAPAS DE EDIÇÃO ===
export const EDITING_STEP_IDS = [
  'decupagem', 
  'musica', 
  'efeitosSonoros', 
  'efeitosVisuais', 
  'legenda', 
  'cor'
] as const;
```

## Resultado Esperado

1. **Calendário Editorial**: Cards na coluna "Edição" não mostram mais as 6 bolinhas de progresso
2. **Mesa de Edição**: Fica limpa, sem referências a notas de edição
3. **Código**: Mais enxuto, sem constantes/interfaces não utilizadas

## Nota sobre o Banco de Dados

Os campos `editing_progress` e `editing_times` na tabela `scripts` **não serão removidos** neste momento porque:
- Migrations de remoção de coluna são mais arriscadas
- Os dados históricos podem ser úteis para análise futura
- Não causam overhead significativo

A remoção do schema pode ser feita em um momento futuro se desejado.

## O Que **Não** Será Alterado

- `Session.tsx` - continua usando `EditingChecklist` (limpeza futura)
- `EditingChecklist.tsx` - mantido por dependência do Session.tsx
- Colunas do banco de dados - mantidas por segurança

## Resumo das Mudanças

| Ação | Arquivo |
|------|---------|
| **DELETAR** | `src/components/editing/EditingNotesPanel.tsx` |
| **EDITAR** | `src/components/calendar/ProductionKanbanCard.tsx` |
| **EDITAR** | `src/components/calendar/ProductionKanbanColumn.tsx` |
| **EDITAR** | `src/components/calendar/ProductionBoardView.tsx` |
| **EDITAR** | `src/components/calendar/OrphanColumn.tsx` |
| **EDITAR** | `src/pages/CalendarioEditorial.tsx` |
| **EDITAR** | `src/lib/kanban-columns.ts` |
| **EDITAR** | `src/pages/EditingWorkspace.tsx` |

