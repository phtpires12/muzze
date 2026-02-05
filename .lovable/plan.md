
# Plano Expandido: Sistema Híbrido de Workflows (Global + Por Conteúdo)

## Visão Geral

Implementar um sistema de **duas camadas** para workflows:
1. **Workflow Global** (já implementado): Define o padrão do usuário, afeta novos conteúdos
2. **Workflow por Conteúdo** (nova funcionalidade): Permite alterar o workflow de um conteúdo específico

---

## Como as Duas Abordagens Coexistem

```text
┌─────────────────────────────────────────────────────────────────────┐
│  HIERARQUIA DE WORKFLOWS                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. WORKFLOW GLOBAL (profile.current_workflow)                      │
│     └── Define o padrão para NOVOS conteúdos                        │
│     └── Determina colunas visíveis no Kanban                        │
│                                                                      │
│  2. WORKFLOW DO CONTEÚDO (script.workflow_template)                 │
│     └── Pode ser diferente do global                                │
│     └── Quando definido, sobrescreve o global para aquele conteúdo  │
│     └── Permite migrar conteúdos sem mudar o workflow do sistema    │
│                                                                      │
│  EXEMPLO PRÁTICO:                                                   │
│  ────────────────                                                   │
│  Usuário usa "Clássico" como padrão (roteiro → revisão → gravação)  │
│  Mas tem um vídeo específico que quer fazer no estilo "Freestyle"   │
│  → Ele muda só aquele conteúdo para Freestyle                       │
│  → O Kanban continua mostrando todas as colunas do Clássico         │
│  → Aquele vídeo específico pula de Ideação direto para Gravação     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mudanças Necessárias

### 1. Banco de Dados

```sql
-- Adicionar campo workflow_template na tabela scripts
ALTER TABLE scripts 
ADD COLUMN workflow_template text DEFAULT NULL;

-- NULL = usa workflow global do usuário
-- 'classic' | 'freestyle' | 'minimalist' = workflow específico
```

### 2. Nova UI: Seletor de Workflow por Conteúdo

Adicionar um seletor na tela de **IdeaDetail** (onde o usuário desenvolve a ideia):

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Desenvolver Ideia                                    ○ Salvo       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Título                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Meu vídeo sobre produtividade                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Tipo de Conteúdo                   Workflow                        │
│  ┌──────────────────────┐           ┌──────────────────────┐       │
│  │ YouTube          ▼   │           │ 🎬 Clássico      ▼   │       │
│  └──────────────────────┘           └──────────────────────┘       │
│                                     (Herdado do sistema)            │
│                                                                      │
│  Ideia Central                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ...                                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Lógica de "Próximo Passo"

O hook `useWorkflowTemplate` será expandido para aceitar um `scriptId` opcional:

```typescript
// Uso atual (workflow global)
const { stages, nextStage } = useWorkflowTemplate();

// Uso novo (workflow do conteúdo, com fallback para global)
const { stages, nextStage } = useWorkflowTemplate({ scriptId: 'abc123' });
```

Se o script tem `workflow_template` definido, usa ele. Senão, usa o global.

---

## Repensando a Coluna "Outras Etapas"

Com o workflow por conteúdo, a coluna "Outras Etapas" ganha um novo propósito:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CENÁRIO: Usuário no workflow "Minimalista" (Ideação → Edição)      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────┐   ┌───────────┐   ┌───────────────────────────┐     │
│  │  Ideação  │   │  Edição   │   │  ⚠️ Outras Etapas (2)     │     │
│  │  (5)      │   │  (2)      │   │                           │     │
│  │           │   │           │   │  ┌─────────────────────┐  │     │
│  │  ...      │   │  ...      │   │  │ Vídeo X             │  │     │
│  │           │   │           │   │  │ 📝 Roteiro          │  │     │
│  │           │   │           │   │  │ Workflow: Clássico  │  │ ← NOVO    │
│  │           │   │           │   │  │ [Trocar Workflow]   │  │     │
│  │           │   │           │   │  └─────────────────────┘  │     │
│  └───────────┘   └───────────┘   └───────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Ações disponíveis no card órfão:**
1. **Arrastar** para uma coluna do workflow atual → muda o status manualmente
2. **Botão "Trocar Workflow"** → abre modal para mudar o workflow daquele conteúdo
3. Se trocar para um workflow compatível, o card sai da coluna "Outras Etapas"

---

## Soluções Complementares Inteligentes

### A) Migração em Lote

Quando o usuário troca o workflow global, oferecer opção de migrar conteúdos existentes:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ✨ Workflow alterado para "Freestyle"                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Você tem 3 conteúdos em etapas que não existem neste workflow.    │
│                                                                      │
│  O que deseja fazer?                                                │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ○ Manter workflows individuais (cada um continua no seu)    │ │
│  │  ○ Migrar todos para Freestyle (mover para etapas válidas)   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│                                         [Cancelar]  [Confirmar]     │
└─────────────────────────────────────────────────────────────────────┘
```

### B) Indicador Visual no Kanban

Cards com workflow diferente do global mostram um badge sutil:

```text
┌───────────────────────────┐
│  📹 Vídeo de Música       │
│  🎤 Freestyle             │  ← Badge indicando workflow diferente
│  12 Jan · Reels           │
└───────────────────────────┘
```

### C) Filtro por Workflow no Kanban

Adicionar um filtro opcional:

```text
Filtrar por workflow: [Todos ▼] [Clássico] [Freestyle] [Minimalista]
```

---

## Arquivos a Modificar/Criar

### Banco de Dados
| Mudança | Descrição |
|---------|-----------|
| **Migração 1** | Atualizar constraint de `profiles.current_workflow` |
| **Migração 2** | Adicionar campo `scripts.workflow_template` |

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/workflows/WorkflowSelector.tsx` | Dropdown para selecionar workflow (reutilizável) |
| `src/components/calendar/OrphanColumn.tsx` | Coluna especial para conteúdos órfãos |
| `src/components/workflows/WorkflowMigrationModal.tsx` | Modal para migração em lote |

### Arquivos a Modificar
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useWorkflowTemplate.ts` | Aceitar `scriptId` opcional para workflow por conteúdo |
| `src/components/brainstorm/IdeaDetail.tsx` | Adicionar seletor de workflow |
| `src/pages/ContentView.tsx` | Mostrar workflow do conteúdo |
| `src/components/calendar/ProductionBoardView.tsx` | Renderizar coluna "Outras Etapas" + badges de workflow |
| `src/components/calendar/ProductionKanbanCard.tsx` | Mostrar badge de workflow quando diferente do global |
| `src/pages/Workflows.tsx` | Adicionar modal de migração ao trocar workflow global |

---

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    WORKFLOW GLOBAL                    WORKFLOW DO CONTEÚDO          │
│    (profiles.current_workflow)        (scripts.workflow_template)   │
│              │                                   │                  │
│              ▼                                   ▼                  │
│    ┌──────────────────┐               ┌──────────────────┐         │
│    │ Colunas visíveis │               │ Próximo passo    │         │
│    │ no Kanban        │               │ daquele conteúdo │         │
│    └──────────────────┘               └──────────────────┘         │
│              │                                   │                  │
│              │         ┌─────────────────────────┘                  │
│              ▼         ▼                                            │
│         ┌─────────────────────────┐                                 │
│         │   useWorkflowTemplate   │                                 │
│         │   (scriptId?: string)   │                                 │
│         └─────────────────────────┘                                 │
│                      │                                              │
│     ┌────────────────┼────────────────┐                             │
│     ▼                ▼                ▼                             │
│  Session.tsx    IdeaDetail.tsx    Kanban.tsx                        │
│  (navegação)    (exibição)        (colunas + órfãos)                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementação

### Fase 1: Corrigir Erro + Infraestrutura (essencial)
1. Migração SQL: atualizar constraint de `profiles.current_workflow`
2. Migração SQL: adicionar campo `scripts.workflow_template`
3. Atualizar hook `useWorkflowTemplate` para aceitar scriptId

### Fase 2: Coluna "Outras Etapas" (essencial)
1. Criar componente `OrphanColumn.tsx`
2. Modificar `ProductionBoardView.tsx` para detectar e renderizar órfãos
3. Mostrar badge de etapa original em cards órfãos

### Fase 3: Workflow por Conteúdo (nova feature)
1. Criar `WorkflowSelector.tsx` (dropdown reutilizável)
2. Adicionar seletor em `IdeaDetail.tsx`
3. Atualizar navegação no Session.tsx para respeitar workflow do conteúdo

### Fase 4: Polish e UX (melhorias)
1. Badge de workflow diferente nos cards do Kanban
2. Modal de migração em lote ao trocar workflow global
3. Filtro por workflow no Kanban (opcional)

---

## Critérios de Aceite

### Fase 1
- [ ] Usuário consegue ativar workflows sem erro
- [ ] Campo `workflow_template` existe na tabela scripts

### Fase 2
- [ ] Coluna "Outras Etapas" aparece quando há conteúdos em etapas fora do workflow
- [ ] Usuário pode arrastar de "Outras Etapas" para qualquer coluna válida
- [ ] Coluna desaparece quando não há órfãos

### Fase 3
- [ ] Usuário pode selecionar workflow diferente para um conteúdo específico
- [ ] Navegação "próximo passo" respeita o workflow do conteúdo
- [ ] Conteúdo com workflow próprio sai da coluna "Outras Etapas"

### Fase 4
- [ ] Badge visual indica quando conteúdo tem workflow diferente do global
- [ ] Modal de migração aparece ao trocar workflow global (se há órfãos)

---

## Considerações Técnicas

### Compatibilidade
- Scripts existentes terão `workflow_template = NULL` (usam workflow global)
- Nenhum dado é perdido ou alterado automaticamente

### Performance
- A detecção de órfãos é O(n) onde n = número de scripts
- Cache do workflow é mantido no ProfileContext (já existe)

### Extensibilidade
- Novos templates podem ser adicionados sem migração de dados
- O sistema é preparado para futuros filtros e visualizações

