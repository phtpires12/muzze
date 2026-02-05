
# Plano: Salvar Workflow Automaticamente na Criação de Conteúdo

## Objetivo

Garantir que todo novo conteúdo criado salve automaticamente o `workflow_template` do usuário no momento da criação, "travando" aquele conteúdo no workflow atual.

---

## Pontos de Criação de Scripts

Existem 4 locais no código onde scripts são criados:

| Arquivo | Função | Contexto |
|---------|--------|----------|
| `CalendarioEditorial.tsx` | `createNewIdea()` | Criar ideia direto no calendário |
| `IdeaForm.tsx` | `handleSubmit()` | Formulário legado de ideias |
| `ScriptEditor.tsx` | `autoSave()` | Criar script direto no editor |
| `BrainstormWorkspace.tsx` | `createNewIdea()` | Workspace de brainstorming |

---

## Mudanças Necessárias

### 1. CalendarioEditorial.tsx (linha ~373)

```typescript
// Antes
.insert({
  user_id: user.id,
  title: "Nova Ideia",
  status: "draft_idea",
  publish_date: publishDate,
  workspace_id: activeWorkspace?.id,
})

// Depois
.insert({
  user_id: user.id,
  title: "Nova Ideia",
  status: "draft_idea",
  publish_date: publishDate,
  workspace_id: activeWorkspace?.id,
  workflow_template: profile?.current_workflow || 'classic',  // ← NOVO
})
```

### 2. IdeaForm.tsx (linha ~119-127)

```typescript
// Antes
const scriptData: any = {
  title: title.trim() || "Nova Ideia",
  content_type: contentType,
  central_idea: centralIdea.trim(),
  reference_url: referenceUrl.trim() || null,
  user_id: user.id,
  publish_date: publishDate,
  workspace_id: activeWorkspace?.id,
};

// Depois
const scriptData: any = {
  title: title.trim() || "Nova Ideia",
  content_type: contentType,
  central_idea: centralIdea.trim(),
  reference_url: referenceUrl.trim() || null,
  user_id: user.id,
  publish_date: publishDate,
  workspace_id: activeWorkspace?.id,
  workflow_template: profile?.current_workflow || 'classic',  // ← NOVO
};
```

### 3. ScriptEditor.tsx (linha ~324)

```typescript
// Antes
const { data, error } = await supabase
  .from('scripts')
  .insert(scriptData)
  .select()
  .single();

// scriptData precisa incluir workflow_template
// Adicionar ao montar scriptData (~linha 300):
scriptData.workflow_template = profile?.current_workflow || 'classic';
```

### 4. BrainstormWorkspace.tsx (linha ~140)

```typescript
// Antes
.insert({
  user_id: user.id,
  title: "",
  status: "draft_idea",
  workspace_id: activeWorkspace.id,
})

// Depois
.insert({
  user_id: user.id,
  title: "",
  status: "draft_idea",
  workspace_id: activeWorkspace.id,
  workflow_template: profile?.current_workflow || 'classic',  // ← NOVO
})
```

---

## Dependências

Cada componente precisa ter acesso ao `profile.current_workflow`. Verificar se já tem:

| Arquivo | Tem ProfileContext? | Ação |
|---------|---------------------|------|
| CalendarioEditorial.tsx | Sim (`useProfileContext`) | Usar direto |
| IdeaForm.tsx | Verificar | Adicionar se necessário |
| ScriptEditor.tsx | Verificar | Adicionar se necessário |
| BrainstormWorkspace.tsx | Sim (`useProfileContext`) | Usar direto |

---

## Fluxo Atualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CRIAÇÃO DE CONTEÚDO                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Usuário está com workflow "Freestyle" ativo                     │
│                                                                      │
│  2. Cria nova ideia em qualquer ponto do app                        │
│                                                                      │
│  3. Sistema salva: workflow_template = 'freestyle'                  │
│                                                                      │
│  4. Usuário muda workflow global para "Clássico"                    │
│                                                                      │
│  5. Ao entrar no conteúdo antigo:                                   │
│     - useWorkflowTemplate lê script.workflow_template = 'freestyle' │
│     - Navegação respeita o workflow original                        │
│                                                                      │
│  6. Novos conteúdos agora salvam workflow_template = 'classic'      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/CalendarioEditorial.tsx` | Adicionar `workflow_template` no insert |
| `src/components/IdeaForm.tsx` | Adicionar `workflow_template` no scriptData + import profile |
| `src/components/ScriptEditor.tsx` | Adicionar `workflow_template` no insert de novo script |
| `src/components/brainstorm/BrainstormWorkspace.tsx` | Adicionar `workflow_template` no insert |

---

## Critérios de Aceite

- [ ] Novo conteúdo criado no Calendário Editorial salva workflow_template
- [ ] Novo conteúdo criado no IdeaForm salva workflow_template
- [ ] Novo conteúdo criado no ScriptEditor salva workflow_template
- [ ] Novo conteúdo criado no BrainstormWorkspace salva workflow_template
- [ ] Conteúdo antigo (workflow_template = NULL) continua usando workflow global
- [ ] Conteúdo novo mantém seu workflow original mesmo após trocar o global

---

## Considerações Técnicas

### Fallback

Se por algum motivo `profile?.current_workflow` for `null`, usar `'classic'` como padrão seguro.

### Compatibilidade

Conteúdos existentes com `workflow_template = NULL` continuarão funcionando normalmente (usam o workflow global como fallback).
