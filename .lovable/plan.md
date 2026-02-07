

# Plano: Atalho Ctrl+Shift+Enter para Novo Take + Opção de Excluir Shotlist

## Resumo

Corrigir dois problemas:
1. **Atalho quebrado**: Ctrl/Cmd+Shift+Enter deve criar um novo take dividindo o atual na posição do cursor
2. **UX faltante**: Adicionar opção para excluir a shotlist inteira (incluindo imagens de referência)

---

## Parte 1: Corrigir Atalho Ctrl/Cmd+Shift+Enter

### Problema Raiz

O `RichTextEditor` (TipTap) não tem listener para capturar `Ctrl+Shift+Enter`. A função `splitShotAtCursor` existe em `ShotListRecord.tsx` e `ShotListReview.tsx`, mas não é invocada pelo teclado.

### Solução

Adicionar um listener global de teclado em ambas as páginas que:
1. Detecta `Ctrl+Shift+Enter` (Windows/Linux) ou `Cmd+Shift+Enter` (Mac)
2. Verifica se o foco está dentro de um editor `.ProseMirror`
3. Encontra qual shot está sendo editado (via elemento ancestral com `data-shot-id`)
4. Obtém a posição do cursor no texto puro
5. Chama `splitShotAtCursor(shotId, cursorPosition)`

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListRecord.tsx` | Adicionar useEffect com listener de teclado para Ctrl/Cmd+Shift+Enter |
| `src/pages/ShotListReview.tsx` | Adicionar useEffect com listener de teclado para Ctrl/Cmd+Shift+Enter |
| `src/components/shotlist/ShotListCard.tsx` | Adicionar `data-shot-id` no container do card para identificação |
| `src/components/shotlist/ShotListTable.tsx` | Adicionar `data-shot-id` na row para identificação |

### Implementação do Listener

```typescript
// useEffect para Ctrl/Cmd+Shift+Enter - criar novo take
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Shift+Enter ou Cmd+Shift+Enter
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
      const target = e.target as HTMLElement;
      const editor = target.closest('.ProseMirror');
      
      if (!editor) return;
      
      // Encontrar o card/row pai que contém o shot
      const shotContainer = editor.closest('[data-shot-id]');
      if (!shotContainer) return;
      
      const shotId = shotContainer.getAttribute('data-shot-id');
      if (!shotId) return;
      
      e.preventDefault();
      
      // Obter posição do cursor no texto puro
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const cursorPosition = preCaretRange.toString().length;
      
      // Chamar split
      splitShotAtCursor(shotId, cursorPosition);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [splitShotAtCursor]);
```

### Atualização do Texto de Ajuda

Atualizar o texto nos componentes de "Use Shift+Enter para quebrar linha" para incluir informação sobre o novo atalho:

```text
Shift+Enter: quebra linha | Ctrl/Cmd+Shift+Enter: novo take
```

---

## Parte 2: Opção de Excluir Shotlist

### Onde Adicionar

Na página `ShotListReview.tsx`, adicionar um botão no header (ou menu de opções) que permite ao usuário excluir toda a shotlist.

### Fluxo do Usuário

1. Usuário clica no botão "Excluir Shotlist" (ou ícone de lixeira com menu)
2. Modal de confirmação aparece: "Tem certeza? Isso apagará todas as cenas e imagens de referência."
3. Ao confirmar:
   - Listar todos os `shotImagePaths` de todos os shots
   - Apagar imagens do bucket `shot-references`
   - Atualizar `shot_list = []` no banco
   - Navegar de volta (ou mostrar painel simplificado)

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListReview.tsx` | Adicionar botão e modal de confirmação para excluir shotlist |

### Implementação

```typescript
const [showDeleteShotlistModal, setShowDeleteShotlistModal] = useState(false);

const handleDeleteShotlist = async () => {
  if (!scriptId) return;
  
  try {
    // 1. Coletar todos os paths de imagens
    const allImagePaths: string[] = [];
    shots.forEach(shot => {
      (shot.shotImagePaths || []).forEach(path => {
        if (path && !allImagePaths.includes(path)) {
          allImagePaths.push(path);
        }
      });
    });
    
    // 2. Apagar imagens do storage
    if (allImagePaths.length > 0) {
      await supabase.storage
        .from('shot-references')
        .remove(allImagePaths);
    }
    
    // 3. Limpar shot_list no banco
    await supabase
      .from('scripts')
      .update({ shot_list: [] })
      .eq('id', scriptId);
    
    toast({
      title: "Shotlist excluída",
      description: "A shotlist foi removida com sucesso",
    });
    
    // 4. Navegar de volta
    navigate(`/calendario`);
    
  } catch (error) {
    console.error('Error deleting shotlist:', error);
    toast({
      title: "Erro ao excluir",
      description: "Não foi possível excluir a shotlist",
      variant: "destructive",
    });
  }
  
  setShowDeleteShotlistModal(false);
};
```

### UI do Botão

Adicionar no header da página, junto aos outros botões:

```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setShowDeleteShotlistModal(true)}
  className="text-destructive hover:text-destructive hover:bg-destructive/10"
  title="Excluir Shotlist"
>
  <Trash2 className="w-5 h-5" />
</Button>
```

### Modal de Confirmação

```tsx
<AlertDialog open={showDeleteShotlistModal} onOpenChange={setShowDeleteShotlistModal}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir Shotlist?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação vai apagar todas as cenas e imagens de referência desta shotlist. 
        Você não poderá desfazer esta ação.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDeleteShotlist}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Excluir Shotlist
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Resumo das Alterações

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/pages/ShotListRecord.tsx` | Adicionar listener Ctrl/Cmd+Shift+Enter para splitShotAtCursor |
| 2 | `src/pages/ShotListReview.tsx` | Adicionar listener Ctrl/Cmd+Shift+Enter + botão excluir shotlist + modal |
| 3 | `src/components/shotlist/ShotListCard.tsx` | Adicionar `data-shot-id={shot.id}` no container |
| 4 | `src/components/shotlist/ShotListTable.tsx` | Adicionar `data-shot-id={shot.id}` na row |

---

## Resultado Esperado

1. **Ctrl/Cmd+Shift+Enter**: Divide o take atual na posição do cursor em dois takes separados (funciona tanto em ShotListRecord quanto em ShotListReview)

2. **Botão Excluir Shotlist**: Aparece no header da ShotListReview, permite ao usuário apagar toda a shotlist e suas imagens de referência

