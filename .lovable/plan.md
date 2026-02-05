
# Plano: Corrigir Divisão de Shots (Shift+Enter)

## Problemas Identificados

### 1. Offset de 3 caracteres
A função `splitShotAtCursor` em `ShotListRecord.tsx` (linha 474-475) faz:
```typescript
const beforeText = shot.scriptSegment.substring(0, cursorPosition);
const afterText = shot.scriptSegment.substring(cursorPosition);
```

O problema é que `scriptSegment` é **HTML** (ex: `<p>2026 vai ser...</p>`), mas `cursorPosition` é a posição no **texto puro**. Os 3 caracteres de diferença são exatamente o `<p>` inicial.

### 2. Código não foi aplicado anteriormente
O `RichTextEditor` ainda não tem:
- A prop `onSplitAtCursor`
- O handler `handleKeyDown` para Shift+Enter

O `ShotListTable.tsx`:
- Linha 226: ainda usa `(window as any).__resolvedUrls?.get(path)` em vez de `resolvedUrls`
- Linha 188-194: não passa `onSplitAtCursor` para o editor

---

## Solução Técnica

### 1. Criar helper para dividir HTML na posição de texto

```typescript
function splitHtmlAtTextPosition(html: string, textPosition: number): { before: string; after: string } {
  // Criar documento temporário
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Percorrer nós de texto
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
  let charCount = 0;
  let splitNode: Text | null = null;
  let splitOffset = 0;
  
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const nodeLength = textNode.textContent?.length || 0;
    
    if (charCount + nodeLength >= textPosition) {
      splitNode = textNode;
      splitOffset = textPosition - charCount;
      break;
    }
    charCount += nodeLength;
  }
  
  if (!splitNode) {
    return { before: html, after: '' };
  }
  
  // Dividir o nó de texto no ponto correto
  const afterTextNode = splitNode.splitText(splitOffset);
  
  // Reconstruir HTML para "antes" e "depois"
  const beforeHtml = tempDiv.innerHTML;
  
  // Para "depois": criar novo container com texto restante
  const afterDiv = document.createElement('div');
  
  // Mover nós após o ponto de divisão
  let currentNode: Node | null = afterTextNode;
  while (currentNode) {
    const nextNode = currentNode.nextSibling;
    afterDiv.appendChild(currentNode.cloneNode(true));
    currentNode = nextNode;
  }
  
  // Envolver em <p> se necessário
  let afterHtml = afterDiv.innerHTML.trim();
  if (afterHtml && !afterHtml.startsWith('<p>')) {
    afterHtml = `<p>${afterHtml}</p>`;
  }
  
  // Limpar HTML "antes" removendo texto após divisão
  // ... (lógica de limpeza)
  
  return { before: beforeHtml, after: afterHtml };
}
```

### 2. Atualizar `splitShotAtCursor` em ShotListRecord.tsx

```typescript
const splitShotAtCursor = (shotId: string, cursorPosition: number) => {
  setShots(currentShots => {
    const shotIndex = currentShots.findIndex(s => s.id === shotId);
    if (shotIndex === -1) return currentShots;

    const shot = currentShots[shotIndex];
    
    // Usar helper que entende HTML
    const { before, after } = splitHtmlAtTextPosition(shot.scriptSegment, cursorPosition);

    // Atualizar shot original com texto ANTES do cursor
    const updatedShot = { ...shot, scriptSegment: before };
    
    // Criar novo shot com texto DEPOIS do cursor
    const newShot: ShotItem = {
      id: crypto.randomUUID(),
      scriptSegment: after,
      scene: '',  // Campos vazios
      shotImagePaths: [],
      location: '',
      sectionName: shot.sectionName,
      isCompleted: false,
    };

    const newShots = [...currentShots];
    newShots[shotIndex] = updatedShot;
    newShots.splice(shotIndex + 1, 0, newShot);

    return newShots;
  });
};
```

### 3. Adicionar `onSplitAtCursor` ao RichTextEditor

**Arquivo**: `src/components/ui/rich-text-editor.tsx`

```typescript
interface RichTextEditorProps {
  // ... props existentes
  onSplitAtCursor?: (cursorPosition: number) => void;
}

// No useEditor, adicionar ao editorProps:
editorProps: {
  handleKeyDown: (view, event) => {
    if (event.key === 'Enter' && event.shiftKey && onSplitAtCursor) {
      event.preventDefault();
      const { from } = view.state.selection;
      // Posição baseada em texto puro
      const textBefore = view.state.doc.textBetween(0, from);
      onSplitAtCursor(textBefore.length);
      return true;
    }
    return false;
  },
  attributes: { /* ... */ },
}
```

### 4. Conectar no ShotListTable.tsx

```tsx
<RichTextEditor
  content={shot.scriptSegment}
  onChange={handleScriptSegmentChange}
  placeholder="Trecho do roteiro..."
  onSplitAtCursor={(cursorPosition) => onSplitAtCursor(shot.id, cursorPosition)}
/>
```

### 5. Corrigir imagens (linha 226)

```typescript
// ANTES:
const resolvedUrl = (window as any).__resolvedUrls?.get(path);

// DEPOIS:
const resolvedUrl = resolvedUrls.get(path);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/rich-text-editor.tsx` | Adicionar prop `onSplitAtCursor` + handler Shift+Enter |
| `src/components/shotlist/ShotListTable.tsx` | Passar callback + corrigir resolvedUrls |
| `src/pages/ShotListRecord.tsx` | Criar helper `splitHtmlAtTextPosition` + atualizar `splitShotAtCursor` |

---

## Resultado Esperado

- Shift+Enter divide o shot **exatamente** onde o cursor está
- Texto **antes** do cursor permanece no shot original
- Texto **depois** do cursor vai para o novo shot (sem duplicação)
- Imagens de referência carregam corretamente
