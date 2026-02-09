
# Correção: Botão "Excluir Ideia" e Texto do Workflow

## Problema 1: Botão "Excluir Ideia" não funciona

O `handleDelete` no `IdeaDetail.tsx` navega para `/calendario` após excluir, mas **não encerra a sessão ativa**. O `useNavigationBlocker` intercepta a navegação porque há um timer rodando, impedindo o redirecionamento.

**Solução**: Antes de excluir, encerrar a sessão silenciosamente (sem celebrações/resumo) e só depois deletar e navegar.

### Arquivo: `src/components/brainstorm/IdeaDetail.tsx`

- Importar `useSessionContext` do `SessionContext`
- No `handleDelete`:
  1. Chamar `resetTimer()` para encerrar o timer sem disparar celebrações
  2. Deletar o script do banco
  3. Navegar para `/calendario`

## Problema 2: Texto quebrado no WorkflowSelector

O `SelectItem` do Radix usa `div` com `flex-col` para mostrar nome + descrição. Isso causa layout quebrado porque o Radix Select renderiza o conteúdo selecionado inline no trigger, e blocos `flex-col` com texto secundário ficam deformados.

**Solução**: Simplificar o conteúdo visivel no trigger — mostrar apenas o emoji + nome (sem descrição) no `SelectTrigger`, mantendo a descrição completa apenas nos itens do dropdown.

### Arquivo: `src/components/workflows/WorkflowSelector.tsx`

- Trocar o conteúdo do `SelectItem` para usar `<span>` inline em vez de `div flex-col`
- Formato: `{icon} {nome}` no valor selecionado
- A descrição aparece apenas dentro do dropdown (via estilo condicional ou usando `SelectItem` com texto simples + tooltip)

## Resumo de Alteracoes

| Arquivo | Mudanca |
|---------|---------|
| `src/components/brainstorm/IdeaDetail.tsx` | Chamar `resetTimer()` antes de deletar para desbloquear navegacao |
| `src/components/workflows/WorkflowSelector.tsx` | Simplificar texto do `SelectItem` para nao quebrar no trigger |
