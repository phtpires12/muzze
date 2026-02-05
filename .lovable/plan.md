
# Plano: Integrar useWorkflowTemplate na Navegação de Sessão

## Visão Geral

Modificar todos os pontos de navegação entre etapas para usar o hook `useWorkflowTemplate`, respeitando o workflow do conteúdo específico (ou o global como fallback).

---

## Análise do Fluxo Atual (Hardcoded)

| Componente | Função | Navegação Atual |
|------------|--------|-----------------|
| IdeaDetail | `handleRoteirizar()` | idea → **script** (sempre) |
| ScriptEditor | `handleNextStage()` | script → **review** / review → **record** |
| ShotListReview | `handleAdvanceToRecord()` | review → **record** |
| ShotListRecord | `handleAdvanceToEdit()` | record → **edit** |
| Session.tsx | Back button (edit stage) | edit → **recording** |

**Problema:** Se o usuário usa "Freestyle" (ideation → recording → editing), a navegação atual tenta ir para "script" que não existe nesse workflow.

---

## Mapeamento de Stages

O sistema usa dois formatos de stage que precisam ser mapeados:

| SessionStage (timer) | CreativeStage (workflow) |
|----------------------|--------------------------|
| `idea` | `ideation` |
| `script` | `script` |
| `review` | `review` |
| `record` | `recording` |
| `edit` | `editing` |

---

## Pontos de Modificação

### 1. IdeaDetail.tsx (Ideação → Próximo)

**Atual:**
```typescript
const handleRoteirizar = async () => {
  navigate(`/session?stage=script&scriptId=${scriptId}`);
};
```

**Novo:**
```typescript
import { useWorkflowTemplate } from "@/hooks/useWorkflowTemplate";

const { nextStage } = useWorkflowTemplate({ scriptWorkflow: workflowTemplate });

const handleAdvanceToNextStage = async () => {
  // Mapear ideation → próximo estágio do workflow
  const next = nextStage('ideation'); // retorna 'script', 'recording', ou 'editing'
  if (!next) return; // já está no último estágio
  
  // Mapear CreativeStage para SessionStage
  const stageMap = { script: 'script', recording: 'record', editing: 'edit' };
  const sessionStage = stageMap[next];
  
  navigate(`/session?stage=${sessionStage}&scriptId=${scriptId}`);
};
```

### 2. ScriptEditor.tsx (Script → Revisão ou Gravação)

**Atual:**
```typescript
const nextStage = isReviewMode ? 'record' : 'review';
```

**Novo:**
- Importar `useWorkflowTemplate`
- Buscar `workflow_template` do script carregado
- Usar `nextStage()` para determinar próximo estágio dinamicamente

### 3. ShotListReview.tsx (Revisão → Gravação)

**Atual:**
```typescript
navigate(`/shot-list/record?scriptId=${scriptId}`);
```

**Novo:**
- Verificar se 'recording' está no workflow
- Se não estiver (ex: Minimalista), ir direto para 'editing'

### 4. ShotListRecord.tsx (Gravação → Edição)

**Atual:**
```typescript
navigate(`/session?stage=edit&scriptId=${scriptId}`);
```

**Novo:**
- Verificar se 'editing' está no workflow (sempre estará nos templates atuais)
- Navegar para edit

### 5. Session.tsx - Botão "Voltar" (Edit → Recording)

**Atual:**
```typescript
navigate(`/shot-list/record?scriptId=${scriptId}`);
```

**Novo:**
- Usar `prevStage('editing')` para determinar estágio anterior
- Se for 'recording', navegar para shot-list/record
- Se for 'ideation' (Minimalista), navegar para session?stage=idea

---

## Arquivo useWorkflowTemplate.ts - Melhorias

Adicionar helper para converter entre SessionStage e CreativeStage:

```typescript
// Mapeamento bidirecional
export const SESSION_TO_CREATIVE: Record<string, CreativeStage> = {
  'idea': 'ideation',
  'ideation': 'ideation',
  'script': 'script',
  'review': 'review',
  'record': 'recording',
  'edit': 'editing',
};

export const CREATIVE_TO_SESSION: Record<CreativeStage, string> = {
  'ideation': 'idea',
  'script': 'script',
  'review': 'review',
  'recording': 'record',
  'editing': 'edit',
};

// Helper para obter próxima URL de navegação
export function getNextStageUrl(
  currentStage: CreativeStage,
  template: WorkflowTemplate,
  scriptId: string
): string | null {
  const currentIndex = template.stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= template.stages.length - 1) {
    return null;
  }
  
  const nextCreativeStage = template.stages[currentIndex + 1];
  const sessionStage = CREATIVE_TO_SESSION[nextCreativeStage];
  
  // Roteiro de gravação tem URL especial
  if (nextCreativeStage === 'recording') {
    return `/shot-list/record?scriptId=${scriptId}`;
  }
  
  return `/session?stage=${sessionStage}&scriptId=${scriptId}`;
}
```

---

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│  NAVEGAÇÃO COM WORKFLOW                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Componente obtém workflow_template do script                    │
│                                                                      │
│  2. Passa para useWorkflowTemplate({ scriptWorkflow: ... })         │
│                                                                      │
│  3. Hook retorna:                                                   │
│     - stages: ['ideation', 'recording', 'editing'] (Freestyle)      │
│     - nextStage('ideation') → 'recording'                           │
│     - prevStage('editing') → 'recording'                            │
│                                                                      │
│  4. Componente navega para a URL correta                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cenários de Teste

### Workflow Clássico (ideation → script → review → recording → editing)
- ✅ IdeaDetail → Script
- ✅ Script → Review
- ✅ Review → Recording
- ✅ Recording → Editing
- ✅ Editing ← Recording (back)

### Workflow Freestyle (ideation → recording → editing)
- ✅ IdeaDetail → Recording (PULA script e review)
- ✅ Recording → Editing
- ✅ Editing ← Recording (back)

### Workflow Minimalista (ideation → editing)
- ✅ IdeaDetail → Editing (PULA tudo)
- ✅ Editing ← Ideation (back)

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/hooks/useWorkflowTemplate.ts` | Adicionar helpers de mapeamento e `getNextStageUrl()` |
| `src/components/brainstorm/IdeaDetail.tsx` | Usar workflow template para navegação dinâmica |
| `src/components/ScriptEditor.tsx` | Buscar workflow do script e usar `nextStage()` |
| `src/pages/ShotListReview.tsx` | Verificar se próximo estágio é recording ou editing |
| `src/pages/ShotListRecord.tsx` | Verificar se próximo estágio é editing |
| `src/pages/Session.tsx` | Atualizar botão "Voltar" no estágio de edição |

---

## Detalhes de Implementação

### IdeaDetail.tsx

```typescript
// Antes
const handleRoteirizar = async () => {
  navigate(`/session?stage=script&scriptId=${scriptId}`);
};

// Depois
const { nextStage, currentTemplate } = useWorkflowTemplate({ 
  scriptWorkflow: workflowTemplate 
});

const handleAdvanceToNextStage = async () => {
  const next = nextStage('ideation');
  if (!next) {
    toast({ title: "Erro", description: "Workflow inválido" });
    return;
  }
  
  // Atualizar status
  await supabase.from("scripts").update({ status: next }).eq("id", scriptId);
  
  // Navegar
  const url = getNextStageUrl('ideation', currentTemplate, scriptId);
  navigate(url);
};
```

### ScriptEditor.tsx

```typescript
// Antes
const nextStage = isReviewMode ? 'record' : 'review';

// Depois
const [scriptWorkflow, setScriptWorkflow] = useState<WorkflowTemplateId | null>(null);
const { nextStage: getNextStage, isStageIncluded } = useWorkflowTemplate({
  scriptWorkflow
});

// No loadScript(), extrair workflow_template e setar

const handleNextStage = async () => {
  const currentCreative = isReviewMode ? 'review' : 'script';
  const next = getNextStage(currentCreative);
  
  if (!next) {
    // Último estágio - encerrar sessão
    return;
  }
  
  // ... resto da lógica
};
```

### Session.tsx - Botão Voltar (Edit Stage)

```typescript
// Antes
navigate(`/shot-list/record?scriptId=${scriptId}`);

// Depois
const { prevStage } = useWorkflowTemplate({ scriptWorkflow: scriptData?.workflow_template });

const handleBackFromEdit = async () => {
  const prev = prevStage('editing');
  
  if (prev === 'recording') {
    navigate(`/shot-list/record?scriptId=${scriptId}`);
  } else if (prev === 'ideation') {
    navigate(`/session?stage=idea&scriptId=${scriptId}`);
  } else {
    // review ou script
    navigate(`/session?stage=${prev}&scriptId=${scriptId}`);
  }
};
```

---

## Considerações Especiais

### 1. Label do Botão "Avançar"

O texto do botão deve refletir o próximo estágio dinâmico:
- "Roteirizar essa ideia" → "Avançar para Roteiro" ou "Avançar para Gravação"
- Usar `getStageLabel(nextStage)` para obter o label correto

### 2. Atualização de Status no Banco

Ao avançar, o status do script deve ser atualizado para o próximo estágio:
- `ideation` → `draft` (script) ou `recording` (freestyle/minimalista)
- `script` → `review` ou `recording`
- etc.

### 3. Fallback para Workflow Global

Se `script.workflow_template` for `null`, usar o workflow global do usuário.

---

## Fases de Implementação

### Fase 1: Helpers no Hook
1. Adicionar mapeamentos SESSION_TO_CREATIVE e CREATIVE_TO_SESSION
2. Adicionar helper `getNextStageUrl()`
3. Garantir que `prevStage()` funciona corretamente

### Fase 2: IdeaDetail (ideation → next)
1. Integrar hook com workflow do script
2. Atualizar botão "Roteirizar" para navegação dinâmica
3. Atualizar label do botão dinamicamente

### Fase 3: ScriptEditor (script/review → next)
1. Carregar workflow_template do script
2. Usar hook para determinar próximo estágio
3. Atualizar label do botão "Avançar"

### Fase 4: ShotList e Session (recording/editing)
1. ShotListReview: verificar se vai para recording ou editing
2. ShotListRecord: confirmar próximo é editing
3. Session.tsx: botão voltar dinâmico

---

## Critérios de Aceite

- [ ] IdeaDetail com Freestyle navega direto para Gravação
- [ ] IdeaDetail com Minimalista navega direto para Edição
- [ ] ScriptEditor respeita workflow ao determinar próximo estágio
- [ ] Botão "Voltar" no edit stage retorna para estágio anterior correto
- [ ] Labels dos botões refletem o próximo estágio dinâmico
- [ ] Status do script é atualizado corretamente ao avançar
