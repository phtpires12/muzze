
# Plano: Ctrl+Z para Desfazer Divisão de Takes

## Contexto

Atualmente, quando o usuário usa Shift+Enter para dividir um take, não há como desfazer essa ação. O usuário precisa manualmente reorganizar e editar os takes, o que é frustrante.

## Arquitetura da Solução

Implementar um sistema de **Undo Stack** (pilha de desfazer) que guarda snapshots do estado dos shots antes de operações destrutivas:

```text
┌─────────────────────────────────────────────────────────────┐
│                    ShotListRecord                           │
│                                                             │
│  shots: ShotItem[]  ←───────────────────┐                   │
│                                         │ restaurar         │
│  undoStack: ShotItem[][]  ─────────────┘                    │
│     └─ [snapshot1, snapshot2, ...]                          │
│                                                             │
│  splitShotAtCursor() {                                      │
│    pushToUndoStack(shots);  // Salvar antes de dividir      │
│    // ... lógica de divisão                                 │
│  }                                                          │
│                                                             │
│  useEffect(() => {                                          │
│    // Listener para Ctrl+Z                                  │
│    if (undoStack.length > 0) {                              │
│      setShots(undoStack.pop());                             │
│    }                                                        │
│  }, [keydown]);                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mudanças Necessárias

### 1. Adicionar estado do Undo Stack

```typescript
// Estado para guardar histórico de undo
const [undoStack, setUndoStack] = useState<ShotItem[][]>([]);
const MAX_UNDO_HISTORY = 20; // Limite para não consumir muita memória
```

### 2. Função helper para salvar no stack

```typescript
const pushToUndoStack = useCallback((currentShots: ShotItem[]) => {
  setUndoStack(prev => {
    // Clonar profundamente para evitar referências
    const snapshot = JSON.parse(JSON.stringify(currentShots));
    const newStack = [...prev, snapshot];
    // Limitar tamanho do histórico
    if (newStack.length > MAX_UNDO_HISTORY) {
      return newStack.slice(-MAX_UNDO_HISTORY);
    }
    return newStack;
  });
}, []);
```

### 3. Modificar `splitShotAtCursor` para salvar antes de dividir

```typescript
const splitShotAtCursor = (shotId: string, cursorPosition: number) => {
  setShots(currentShots => {
    // Salvar estado atual antes da divisão
    pushToUndoStack(currentShots);
    
    // ... resto da lógica de divisão (já existente)
  });
};
```

### 4. Adicionar listener para Ctrl+Z

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Z ou Cmd+Z (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      // Verificar se não estamos em um input/textarea comum
      const target = e.target as HTMLElement;
      const isInEditor = target.closest('.ProseMirror') || 
                         target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA';
      
      // Se estiver em um editor, deixar o TipTap lidar com undo local
      if (isInEditor) return;
      
      // Undo global (desfazer divisão de take)
      if (undoStack.length > 0) {
        e.preventDefault();
        
        setUndoStack(prev => {
          const newStack = [...prev];
          const previousState = newStack.pop();
          
          if (previousState) {
            setShots(previousState);
            toast({
              title: "Desfeito!",
              description: "Divisão de take desfeita",
            });
          }
          
          return newStack;
        });
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undoStack.length]);
```

### 5. (Opcional) Estender para outras operações destrutivas

Também podemos salvar estado antes de:
- Remover um shot (`removeShot`)
- Reordenar shots (`handleDragEnd`)

```typescript
const removeShot = (id: string) => {
  pushToUndoStack(shots);
  setShots(shots.filter(s => s.id !== id));
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    pushToUndoStack(shots); // Salvar antes de reordenar
    setShots((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListRecord.tsx` | Adicionar `undoStack` state, `pushToUndoStack` helper, listener Ctrl+Z, salvar estado antes de `splitShotAtCursor` |

---

## Comportamento Esperado

- **Ctrl+Z fora de inputs**: Desfaz última divisão de take (restaura estado anterior)
- **Ctrl+Z dentro do editor**: TipTap lida com undo local (desfaz digitação)
- **Feedback visual**: Toast "Desfeito!" confirma a ação
- **Limite de 20 snapshots**: Evita consumo excessivo de memória

---

## Critérios de Aceite

- [ ] Ctrl+Z desfaz divisão de take criada por Shift+Enter
- [ ] Take original é restaurado com texto completo
- [ ] Take novo é removido
- [ ] Toast confirma que ação foi desfeita
- [ ] Undo funciona múltiplas vezes (pilha de histórico)
- [ ] Undo dentro do editor de texto não interfere (TipTap lida localmente)
