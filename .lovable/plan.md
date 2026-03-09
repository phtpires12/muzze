

## Diagnóstico do Problema

Encontrei o bug. Sua esposa (Vick Diniz) tem plano Studio e criou o workspace "Carrosseis Virais" **3 vezes** — o que confirma que os dados estão sendo salvos no banco, mas ela não consegue vê-los depois.

**Causa raiz:** Tanto o `WorkspaceContext` quanto o `useWorkspace` usam `.maybeSingle()` para buscar o workspace do owner. No Supabase, `.maybeSingle()` **retorna erro se houver mais de 1 resultado**. Então, no momento em que ela cria um segundo workspace, a query falha silenciosamente e **nenhum** workspace é carregado — parece que nada foi salvo.

```text
Fluxo atual (bugado):
  1. Cria workspace → INSERT no banco → sucesso ✓
  2. Reload da página
  3. WorkspaceContext busca: .eq('owner_id', userId).maybeSingle()
  4. Retorna ERRO (2+ resultados) → nenhum workspace carregado ✗
```

**Dados no banco agora:**
- `Meu Workspace` (original, dez/2025)
- `Carrosseis Virais` x3 (duplicatas criadas em 07/mar)

## Plano de Correção

### 1. Corrigir `WorkspaceContext.tsx`
Trocar `.maybeSingle()` por busca de todos os workspaces owned. Já busca memberships corretamente, mas o trecho de workspaces próprios precisa retornar uma lista.

### 2. Corrigir `useWorkspace.ts`
Mesmo problema — trocar `.maybeSingle()` por busca que suporta múltiplos workspaces. Usar o workspace ativo do contexto em vez de buscar independentemente.

### 3. Após criar workspace, fazer switch automático
No `ProfileSheet.tsx`, após `createWorkspace` retornar sucesso com `workspaceId`, chamar `switchWorkspace(workspaceId)` e `refetch()` do contexto em vez de `window.location.reload()`.

### 4. Limpar dados duplicados
Remover os 2 workspaces duplicados "Carrosseis Virais" do banco, mantendo apenas 1.

