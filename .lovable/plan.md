
# Plano: Shift+Enter para Dividir Shot em Novo Take

## Entendimento

O usuário quer que **Shift+Enter divida o shot atual em dois shots separados** no ponto do cursor:
- Texto antes do cursor: permanece no shot atual
- Texto depois do cursor: vai para um novo shot (com campos vazios de cena, imagem, locação)

A função `splitShotAtCursor` já existe em `ShotListRecord.tsx` (linhas 468-493), mas não está conectada ao `RichTextEditor`.

---

## Arquitetura da Solução

```text
┌────────────────────────────────────────────────────────────────────┐
│                        ShotListCard                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RichTextEditor (Trecho do Roteiro)                          │  │
│  │                                                              │  │
│  │  [Usuário pressiona Shift+Enter]                             │  │
│  │           ↓                                                  │  │
│  │  handleKeyDown → detecta Shift+Enter                         │  │
│  │           ↓                                                  │  │
│  │  Chama onSplitShot(cursorPosition)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  Props: onSplitShot(cursorPosition)                                │
└────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│                    ShotListRecord                                  │
│                                                                    │
│  splitShotAtCursor(shotId, cursorPosition)                         │
│  - Divide scriptSegment no ponto do cursor                         │
│  - Cria novo shot com texto restante                               │
│  - Insere logo após o shot atual                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Mudanças Necessárias

### 1. Atualizar `RichTextEditor` para aceitar callback de split

**Arquivo**: `src/components/ui/rich-text-editor.tsx`

Adicionar nova prop `onSplitAtCursor`:

```typescript
interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: string;
  showMobileLineBreak?: boolean;
  onSplitAtCursor?: (cursorPosition: number) => void;  // NOVO
}
```

Adicionar `handleKeyDown` no `editorProps` para interceptar Shift+Enter:

```typescript
editorProps: {
  handleKeyDown: (view, event) => {
    if (event.key === 'Enter' && event.shiftKey && onSplitAtCursor) {
      event.preventDefault();
      
      // Obter posição do cursor no texto puro (sem HTML)
      const { from } = view.state.selection;
      const textBefore = view.state.doc.textBetween(0, from);
      const cursorPosition = textBefore.length;
      
      onSplitAtCursor(cursorPosition);
      return true;
    }
    return false;
  },
  // ... outras props
}
```

### 2. Atualizar `ShotListCard` para passar callback

**Arquivo**: `src/components/shotlist/ShotListCard.tsx`

Passar `onSplitAtCursor` para o `RichTextEditor` do campo "Trecho do Roteiro":

```tsx
<RichTextEditor
  content={shot.scriptSegment}
  onChange={handleScriptSegmentChange}
  placeholder="Trecho do roteiro..."
  minHeight="120px"
  onSplitAtCursor={(cursorPosition) => onSplitAtCursor(shot.id, cursorPosition)}
/>
```

### 3. Atualizar texto de ajuda

Trocar "Use Shift+Enter para quebrar linha" por "Use Shift+Enter para criar novo take":

```tsx
<span className="text-xs text-muted-foreground hidden md:inline">
  Use Shift+Enter para criar novo take
</span>
```

---

## Desafio: Posição do Cursor em HTML

O conteúdo é HTML (`<p>Texto <strong>negrito</strong></p>`), mas precisamos da posição no texto puro para dividir corretamente.

**Solução**: Usar `view.state.doc.textBetween(0, from)` do ProseMirror para obter apenas o texto até o cursor, ignorando tags HTML.

A função `splitShotAtCursor` em `ShotListRecord.tsx` espera uma posição baseada em texto puro (`shot.scriptSegment.substring()`), mas como o conteúdo é HTML, precisamos ajustar para dividir o HTML corretamente.

**Ajuste na função split**:

```typescript
const splitShotAtCursor = (shotId: string, cursorPosition: number) => {
  setShots(currentShots => {
    const shotIndex = currentShots.findIndex(s => s.id === shotId);
    if (shotIndex === -1) return currentShots;

    const shot = currentShots[shotIndex];
    
    // Dividir HTML baseado na posição do texto
    const { beforeHtml, afterHtml } = splitHtmlAtPosition(shot.scriptSegment, cursorPosition);

    const updatedShot = { ...shot, scriptSegment: beforeHtml };
    const newShot: ShotItem = {
      id: crypto.randomUUID(),
      scriptSegment: afterHtml,
      scene: '',  // Novo take começa com campos vazios
      shotImagePaths: [],
      location: '',
      sectionName: shot.sectionName,  // Herda a seção
      isCompleted: false,
    };

    const newShots = [...currentShots];
    newShots[shotIndex] = updatedShot;
    newShots.splice(shotIndex + 1, 0, newShot);

    return newShots;
  });
};
```

**Helper para dividir HTML**:

```typescript
function splitHtmlAtPosition(html: string, textPosition: number): { beforeHtml: string; afterHtml: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  
  let charCount = 0;
  let splitNode: Text | null = null;
  let splitOffset = 0;
  
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const nodeLength = textNode.length;
    
    if (charCount + nodeLength >= textPosition) {
      splitNode = textNode;
      splitOffset = textPosition - charCount;
      break;
    }
    charCount += nodeLength;
  }
  
  if (!splitNode) {
    return { beforeHtml: html, afterHtml: '' };
  }
  
  // Dividir o nó de texto
  const afterTextNode = splitNode.splitText(splitOffset);
  
  // Clonar estrutura para "depois"
  const afterBody = doc.body.cloneNode(true) as HTMLElement;
  
  // Limpar texto "antes" do clone "depois"
  // ... (lógica de limpeza de nós)
  
  // Serializar ambos
  const beforeHtml = doc.body.innerHTML;
  const afterHtml = afterBody.innerHTML;
  
  return { beforeHtml: beforeHtml.trim(), afterHtml: afterHtml.trim() };
}
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/rich-text-editor.tsx` | Adicionar prop `onSplitAtCursor` e handler de Shift+Enter |
| `src/components/shotlist/ShotListCard.tsx` | Passar callback para RichTextEditor, atualizar texto de ajuda |
| `src/pages/ShotListRecord.tsx` | Atualizar `splitShotAtCursor` para lidar com HTML |

---

## Critérios de Aceite

- [ ] Shift+Enter no campo "Trecho do Roteiro" divide o shot em dois
- [ ] Texto antes do cursor permanece no shot original
- [ ] Texto depois do cursor vai para um novo shot abaixo
- [ ] Novo shot herda apenas a seção (sectionName), demais campos vazios
- [ ] Texto de ajuda atualizado para "Use Shift+Enter para criar novo take"
- [ ] Formatação (negrito, itálico) é preservada após a divisão
