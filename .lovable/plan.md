
# Plano: Corrigir Navegação para Editing Workspace

## Problema Identificado

Ao clicar em "Avançar para Edição" na página de gravação (`ShotListRecord`), o usuário está sendo redirecionado para a página de encerramento de sessão em vez do Editing Workspace.

### Causa Raiz

1. O código em `ShotListRecord.tsx` chama `getNextStageUrl('recording', currentTemplate, scriptId)` para obter a URL do próximo estágio
2. Se essa função retorna `null` (o que pode acontecer se o `currentTemplate` não estiver carregado corretamente), o código usa um **fallback para `/session?stage=edit`**
3. A página `/session` tenta redirecionar para `/editing-workspace`, mas há um delay entre a renderização e o redirecionamento, fazendo o usuário ver a UI de sessão

### Evidência

```typescript
// ShotListRecord.tsx linhas 403-406 e 427-428
const url = getNextStageUrl('recording', currentTemplate, scriptId!);
navigate(url || `/session?stage=edit&scriptId=${scriptId}`);
//             ↑ Este fallback vai para Session, não Editing Workspace
```

---

## Solução

Trocar o fallback de `/session?stage=edit` para `/editing-workspace` diretamente, já que este é sempre o destino esperado quando saindo de `recording`.

### Mudanças

| Arquivo | Linha | De | Para |
|---------|-------|-----|------|
| `ShotListRecord.tsx` | ~405 | `url \|\| \`/session?stage=edit&scriptId=${scriptId}\`` | `url \|\| \`/editing-workspace?scriptId=${scriptId}\`` |
| `ShotListRecord.tsx` | ~428 | `url \|\| \`/session?stage=edit&scriptId=${scriptId}\`` | `url \|\| \`/editing-workspace?scriptId=${scriptId}\`` |

---

## Código Atualizado

```typescript
// Antes (linha 403-406)
const url = getNextStageUrl('recording', currentTemplate, scriptId!);
setTimeout(() => {
  navigate(url || `/session?stage=edit&scriptId=${scriptId}`);
}, 500);

// Depois
const url = getNextStageUrl('recording', currentTemplate, scriptId!);
setTimeout(() => {
  navigate(url || `/editing-workspace?scriptId=${scriptId}`);
}, 500);
```

```typescript
// Antes (linha 427-428)
const url = getNextStageUrl('recording', currentTemplate, scriptId!);
navigate(url || `/session?stage=edit&scriptId=${scriptId}`);

// Depois
const url = getNextStageUrl('recording', currentTemplate, scriptId!);
navigate(url || `/editing-workspace?scriptId=${scriptId}`);
```

---

## Benefícios

- Navegação direta para o Editing Workspace, sem passar pela página Session
- Elimina o flash/delay de redirecionamento intermediário
- Funciona mesmo se o `currentTemplate` não estiver carregado (fallback seguro)

---

## Critérios de Aceite

- [ ] Clicar em "Avançar para Edição" leva diretamente ao Editing Workspace
- [ ] O scriptId é passado corretamente na URL
- [ ] Todos os painéis do Editing Workspace carregam normalmente
- [ ] Funciona com qualquer workflow template (classic, freestyle, minimalist)
