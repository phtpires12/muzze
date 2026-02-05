
# Plano: Corrigir Renderização da Etapa de Edição

## Problema Identificado

A página `Session.tsx` está **renderizando a UI antiga** (`EditingChecklist`) em vez de redirecionar para o novo `EditingWorkspace`. O problema é uma **condição de corrida** entre a renderização e o useEffect de redirecionamento.

### Estrutura Atual Problemática

```text
Session.tsx fluxo:
┌─────────────────────────────────────────┐
│ 1. Componente monta                     │
│ 2. Renderiza UI (incluindo checklist)   │ ← UI antiga aparece aqui!
│ 3. useEffect executa                    │
│ 4. navigate() é chamado                 │ ← Tarde demais
│ 5. Redirecionamento para workspace      │
└─────────────────────────────────────────┘
```

Comparação com outras etapas que **funcionam corretamente**:

| Stage   | Linha | Comportamento |
|---------|-------|---------------|
| `idea`  | 474   | Early return com `<IdeaDetail />` ou `<BrainstormWorkspace />` |
| `record`| 462   | Early return com loading spinner enquanto busca scriptId |
| `edit`  | 752   | **NÃO TEM early return** → renderiza `EditingChecklist` antes do redirect |

---

## Solução

Adicionar um **early return** para `stage === "edit"` **antes** da renderização final, mostrando um loading state enquanto o redirect acontece.

### Mudança em `src/pages/Session.tsx`

Após o bloco de `session.stage === "script" || session.stage === "review"` (linha 583), adicionar:

```typescript
// If stage is "edit", show loading while redirecting to Editing Workspace
if (session.stage === "edit") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Abrindo mesa de edição...</p>
      </div>
    </div>
  );
}
```

Isso garante que:
1. Quando `stage === "edit"`, a UI renderiza um loader imediato
2. O useEffect (linhas 279-285) executa e faz o `navigate()` para `/editing-workspace`
3. O usuário **nunca vê** a UI antiga do `EditingChecklist`

---

## Código Final (apenas a adição)

Inserir **após linha ~583** (depois do bloco de script/review):

```typescript
// If stage is "edit", show loading while redirecting to Editing Workspace
if (session.stage === "edit") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Abrindo mesa de edição...</p>
      </div>
    </div>
  );
}
```

---

## Benefícios

- **Elimina a renderização da UI antiga** durante o redirect
- **Consistente** com o padrão usado para `record` e `idea`
- **Experiência suave**: usuário vê "Abrindo mesa de edição..." por ~100ms antes de ir ao workspace

---

## Consideração Secundária

O componente `EditingChecklist` (linha 758) pode ser removido depois como cleanup, já que nunca mais será usado. Mas isso pode ser feito numa segunda etapa.

---

## Critérios de Aceite

- [ ] Navegar para `/session?stage=edit&scriptId=...` mostra loading por instante, depois vai para Editing Workspace
- [ ] O `EditingChecklist` antigo nunca é exibido
- [ ] O timer continua funcionando corretamente no Editing Workspace
