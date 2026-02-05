

# Plano: Corrigir Imagens Quebradas e Shift+Enter no ShotListRecord

## Problema 1: Imagem de Referência Não Carrega

### Diagnóstico
No arquivo `src/components/shotlist/ShotListTable.tsx` (linha 226), o código tenta buscar a URL resolvida usando uma variável global inexistente:

```typescript
const resolvedUrl = (window as any).__resolvedUrls?.get(path);
```

No entanto, a prop `resolvedUrls` é passada corretamente para o componente mas **não está sendo usada**. Esta é a fonte do bug - a imagem sempre mostra o `path` bruto (que não é uma URL válida) em vez da signed URL resolvida.

### Solução
Corrigir a linha 226 para usar a prop `resolvedUrls` que já é passada corretamente:

```typescript
// ANTES (errado):
const resolvedUrl = (window as any).__resolvedUrls?.get(path);

// DEPOIS (correto):
const resolvedUrl = resolvedUrls.get(path);
```

### Arquivo a Modificar
| Arquivo | Alteração |
|---------|-----------|
| `src/components/shotlist/ShotListTable.tsx` | Linha 226: substituir `(window as any).__resolvedUrls?.get(path)` por `resolvedUrls.get(path)` |

---

## Problema 2: Shift+Enter Não Funciona para Quebrar Linha

### Diagnóstico
O TipTap com StarterKit deveria suportar `Shift+Enter` para inserir um `hardBreak` (quebra de linha sem novo parágrafo) por padrão. No entanto, o comportamento atual está criando um novo parágrafo em vez de uma quebra de linha.

O problema é que o StarterKit **inclui a extensão HardBreak por padrão**, mas pode haver conflito com outras extensões (GlobalDragHandle, AutoJoiner, NotionListKeymap) que estão interceptando o evento de teclado.

### Solução
Adicionar configuração explícita do `HardBreak` no StarterKit com shortcut garantido:

```typescript
StarterKit.configure({
  // ... outras configs
  hardBreak: {
    keepMarks: true,  // Mantém formatação após quebra de linha
  },
}),
```

Além disso, criar um handler de teclado customizado para garantir que Shift+Enter sempre funcione:

```typescript
editorProps: {
  handleKeyDown: (view, event) => {
    // Garantir que Shift+Enter insere hardBreak
    if (event.key === 'Enter' && event.shiftKey) {
      view.dispatch(
        view.state.tr.replaceSelectionWith(
          view.state.schema.nodes.hardBreak.create()
        )
      );
      return true;
    }
    return false;
  },
}
```

### Arquivo a Modificar
| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/rich-text-editor.tsx` | Adicionar `handleKeyDown` no `editorProps` para interceptar Shift+Enter |

---

## Resumo das Mudanças

| Problema | Arquivo | Correção |
|----------|---------|----------|
| Imagem quebrada | `ShotListTable.tsx` | Usar prop `resolvedUrls` em vez de `window.__resolvedUrls` |
| Shift+Enter | `rich-text-editor.tsx` | Adicionar handler de teclado para garantir hardBreak |

---

## Critérios de Aceite

- [ ] Imagens de referência carregam corretamente no ShotListRecord
- [ ] Imagens aparecem como thumbnail na galeria de edição
- [ ] Shift+Enter cria quebra de linha (não novo parágrafo)
- [ ] Botão mobile "Nova linha" continua funcionando

