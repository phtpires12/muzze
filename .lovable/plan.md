

# Plano: Sistema de Templates de Workflow

## Resumo

Substituir a página "Em breve / Novidades" por uma funcionalidade real: **Templates de Workflow** que permitem ao usuário escolher diferentes ordens para as etapas de criação de conteúdo.

---

## Templates Confirmados

| ID | Nome | Etapas | Descrição |
|----|------|--------|-----------|
| `classic` | Clássico | Ideação → Roteiro → Revisão → Gravação → Edição | "O fluxo completo de produção" |
| `freestyle` | Freestyle | Ideação → Gravação → Edição | "Pra quem improvisa na hora" |
| `minimalist` | Minimalista | Ideação → Edição | "Ideal para edits e montagens" |

---

## Arquitetura

### Novos Arquivos a Criar

1. **`src/lib/workflow-templates.ts`** - Definições dos templates
2. **`src/hooks/useWorkflowTemplate.ts`** - Hook centralizado para gerenciar template ativo
3. **`src/pages/Workflows.tsx`** - Nova página com carrossel de seleção (substitui `Novidades.tsx`)
4. **`src/components/workflows/WorkflowCard.tsx`** - Card individual para cada template no carrossel

### Arquivos a Modificar

1. **`src/App.tsx`** - Trocar rota `/novidades` por `/workflows`
2. **`src/pages/Index.tsx`** - Atualizar botão "Em breve" para "Workflow"
3. **`src/lib/kanban-columns.ts`** - Adicionar função para ordenar colunas dinamicamente
4. **`src/components/calendar/ProductionBoardView.tsx`** - Usar colunas ordenadas pelo template ativo

### Arquivos a Deletar

1. **`src/pages/Novidades.tsx`** - Será substituído por `Workflows.tsx`
2. **`src/lib/workflows.ts`** - Arquivo legado com sistema antigo de workflows

---

## Detalhes Técnicos

### 1. Estrutura do Template (`src/lib/workflow-templates.ts`)

```typescript
import { CreativeStage } from "@/types/workspace";

export type WorkflowTemplateId = 'classic' | 'freestyle' | 'minimalist';

export interface WorkflowTemplate {
  id: WorkflowTemplateId;
  name: string;
  description: string;
  stages: CreativeStage[];
  icon: string;
  gradient: string;
}

export const WORKFLOW_TEMPLATES: Record<WorkflowTemplateId, WorkflowTemplate> = {
  classic: {
    id: 'classic',
    name: 'Clássico',
    description: 'O fluxo completo de produção',
    stages: ['ideation', 'script', 'review', 'recording', 'editing'],
    icon: '🎬',
    gradient: 'from-blue-500 to-cyan-500',
  },
  freestyle: {
    id: 'freestyle',
    name: 'Freestyle',
    description: 'Pra quem improvisa na hora',
    stages: ['ideation', 'recording', 'editing'],
    icon: '🎤',
    gradient: 'from-orange-500 to-yellow-500',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Ideal para edits e montagens',
    stages: ['ideation', 'editing'],
    icon: '✂️',
    gradient: 'from-purple-500 to-pink-500',
  },
};

export const DEFAULT_TEMPLATE_ID: WorkflowTemplateId = 'classic';
```

### 2. Hook Centralizado (`src/hooks/useWorkflowTemplate.ts`)

```typescript
// Responsabilidades:
// - Carregar template ativo do profile.current_workflow
// - Métodos: nextStage(), prevStage(), isFirstStage(), isLastStage()
// - Método setTemplate() para salvar no banco
// - Retornar colunas ordenadas para o Kanban
```

### 3. Persistência

O campo `profiles.current_workflow` já existe no banco de dados. Vamos usá-lo para salvar o ID do template selecionado (`'classic'`, `'freestyle'`, `'minimalist'`).

### 4. Nova Página com Carrossel (`src/pages/Workflows.tsx`)

A página usará o componente `Carousel` existente (Embla Carousel) para exibir os 3 templates em formato de carrossel horizontal com:
- Cards visuais com ícone, nome e descrição
- Indicador visual do template ativo (borda ou badge)
- Dots de navegação abaixo do carrossel
- Botão "Ativar" em cada card (ou clique no card)

### 5. Kanban Dinâmico

O `ProductionBoardView.tsx` passará a renderizar apenas as colunas do template ativo, na ordem definida.

Exemplo para template "Minimalista":
- Só mostra: Ideação → Edição
- Oculta: Roteiro, Revisão, Gravação

---

## Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│  profiles.current_workflow (banco de dados)                     │
│  Valor: 'classic' | 'freestyle' | 'minimalist'                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  useWorkflowTemplate()                                           │
│  - Lê do ProfileContext                                         │
│  - Retorna template ativo, stages[], métodos de navegação       │
└───────┬─────────────────────────────────────────┬───────────────┘
        │                                         │
        ▼                                         ▼
┌───────────────────┐                    ┌────────────────────────┐
│  Kanban Board     │                    │  Navegação Session     │
│  (colunas dinâm.) │                    │  (próxima/anterior)    │
└───────────────────┘                    └────────────────────────┘
```

---

## Fases de Implementação

### Fase 1: Infraestrutura (sem mudanças visuais)
1. Criar `src/lib/workflow-templates.ts` com os 3 templates
2. Criar `src/hooks/useWorkflowTemplate.ts`
3. Adicionar helpers para colunas dinâmicas em `kanban-columns.ts`

### Fase 2: Nova Página de Workflows
1. Criar `src/pages/Workflows.tsx` com carrossel
2. Criar `src/components/workflows/WorkflowCard.tsx`
3. Atualizar rota em `App.tsx` (`/novidades` → `/workflows`)
4. Atualizar botão na Home (`Index.tsx`)
5. Deletar `src/pages/Novidades.tsx` e `src/lib/workflows.ts`

### Fase 3: Integração no Kanban
1. Modificar `ProductionBoardView.tsx` para usar colunas do template ativo

### Fase 4 (Futura): Navegação Completa
Esta fase será implementada depois, conforme necessidade:
- Integrar hook no `Session.tsx` para navegação entre etapas
- Integrar no `ContinuityCarousel` e outros componentes

---

## UI do Carrossel

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Seu Workflow de Criação                                            │
│  Escolha como você prefere produzir conteúdo                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                                                            │     │
│  │   🎬                                                       │     │
│  │   CLÁSSICO                                    ✓ ATIVO      │     │
│  │                                                            │     │
│  │   O fluxo completo de produção                             │     │
│  │                                                            │     │
│  │   ┌─────────┐ → ┌─────────┐ → ┌─────────┐                 │     │
│  │   │ Ideação │   │ Roteiro │   │ Revisão │ → ...           │     │
│  │   └─────────┘   └─────────┘   └─────────┘                 │     │
│  │                                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│                         ● ○ ○                                       │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ⚡ O que muda?                                                      │
│  A ordem das colunas no Kanban de Produção e o fluxo de "próximo    │
│  passo" ao terminar cada etapa. Seu histórico permanece intacto.    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceite

1. Página `/workflows` exibe carrossel com 3 templates
2. Usuário pode navegar entre templates com swipe ou dots
3. Ao clicar em um template, ele é ativado e salvo no banco
4. Template ativo tem indicador visual (badge/borda)
5. Kanban de Produção mostra apenas as colunas do template ativo
6. Botão na Home navega para `/workflows` (não mais `/novidades`)
7. Arquivos legados removidos (`Novidades.tsx`, `workflows.ts`)

---

## Considerações

- **Compatibilidade**: Projetos existentes continuam funcionando (mantêm seu `status` atual)
- **Default**: Usuários sem template definido usam `'classic'`
- **Extensibilidade**: Novos templates podem ser adicionados facilmente ao objeto `WORKFLOW_TEMPLATES`

