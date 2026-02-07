

# Plano: Atalho Shift+Enter para Criar Novo Take

## Resumo

Alterar o atalho de split de take:

| Tecla | Comportamento |
|-------|---------------|
| **Enter** | Quebra de linha / novo parágrafo (comportamento normal do editor) |
| **Shift+Enter** | Divide o take na posição do cursor (cria novo take) |

---

## Lógica do Comportamento

```text
Dentro do editor de take:
├── Enter → Comportamento normal do TipTap (novo parágrafo)
└── Shift+Enter → Divide o take na posição do cursor
```

Isso é intuitivo porque:
- **Enter** = continua escrevendo normalmente
- **Shift+Enter** = ação especial de "cortar aqui e criar novo take"

---

## Alterações Técnicas

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListRecord.tsx` | Mudar listener para `Shift+Enter` (sem Ctrl/Cmd) |
| `src/pages/ShotListReview.tsx` | Mudar listener para `Shift+Enter` (sem Ctrl/Cmd) |
| `src/components/shotlist/ShotListCard.tsx` | Atualizar texto de ajuda |
| `src/components/shotlist/ShotListTable.tsx` | Atualizar texto de ajuda |

### Nova Lógica do Listener

```typescript
// Shift+Enter para criar novo take
useEffect(() => {
  const handleSplitKeyDown = (e: KeyboardEvent) => {
    // Shift+Enter SEM Ctrl/Cmd = novo take
    if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const target = e.target as HTMLElement;
      const editor = target.closest('.ProseMirror');
      
      if (!editor) return;
      
      const shotContainer = editor.closest('[data-shot-id]');
      if (!shotContainer) return;
      
      const shotId = shotContainer.getAttribute('data-shot-id');
      if (!shotId) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Obter posição do cursor
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const cursorPosition = preCaretRange.toString().length;
      
      splitShotAtCursor(shotId, cursorPosition);
    }
  };

  window.addEventListener('keydown', handleSplitKeyDown, true);
  return () => window.removeEventListener('keydown', handleSplitKeyDown, true);
}, []);
```

### Novo Texto de Ajuda

```tsx
// Antes:
"Shift+Enter: quebra linha | Ctrl/Cmd+Shift+Enter: novo take"

// Depois:
"Shift+Enter: novo take"
```

Nota: Não precisa mencionar Enter porque é o comportamento padrão esperado.

---

## Resumo das Alterações

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/pages/ShotListRecord.tsx` | Mudar condição: `e.shiftKey && !e.ctrlKey && !e.metaKey` |
| 2 | `src/pages/ShotListReview.tsx` | Mudar condição: `e.shiftKey && !e.ctrlKey && !e.metaKey` |
| 3 | `src/components/shotlist/ShotListCard.tsx` | Texto: "Shift+Enter: novo take" |
| 4 | `src/components/shotlist/ShotListTable.tsx` | Texto: "Shift+Enter: novo take" |

---

## Resultado Esperado

- **Enter**: Funciona normalmente (novo parágrafo no texto)
- **Shift+Enter**: Divide o take atual na posição do cursor, criando um novo take abaixo

