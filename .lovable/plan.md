
## Plano: Corrigir Comportamento do Popup do Timer

### Problema Identificado

Após a implementação do modo expandido, quando o usuário sai da página principal (muda de aba/minimiza), o timer está abrindo em uma **nova aba do navegador** ao invés de uma **janela popup separada**.

Isso acontece porque:
1. O navegador está interpretando o `window.open` como abertura de aba (e não popup)
2. Quando abre como aba, o timer com `isPopup=true` ocupa toda a tela preta
3. A imagem mostra exatamente isso: timer centralizado em tela cheia preta

### Causa Raiz

1. **Delay de 150ms** em `Session.tsx` pode fazer o navegador bloquear/converter o popup
2. **Falta de parametros explicitos** no `window.open` para forçar comportamento de popup
3. **Peso do componente** com animações pode atrasar a abertura

### Solucao

1. **Reduzir o delay** de 150ms para 50ms em `Session.tsx`
2. **Adicionar `popup=yes`** nos features do `window.open` em `useWindowPortal.tsx`
3. **Adicionar `noopener`** para melhor compatibilidade cross-browser

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useWindowPortal.tsx` | Adicionar parametros `popup=yes` e `noopener` no `window.open` |
| `src/pages/Session.tsx` | Reduzir delay de 150ms para 50ms |

---

### Secao Tecnica

**useWindowPortal.tsx - Modificacao no window.open (linha 42-46):**

Antes:
```typescript
const popup = window.open(
  '',
  'timer-popup',
  `width=${width},height=${height},left=100,top=100,resizable=yes,scrollbars=no`
);
```

Depois:
```typescript
const popup = window.open(
  '',
  'timer-popup',
  `width=${width},height=${height},left=100,top=100,resizable=yes,scrollbars=no,popup=yes,noopener=no`
);
```

**Session.tsx - Reduzir delay (linha 371-376):**

Antes:
```typescript
const timeoutId = setTimeout(() => {
  if (!isPausedRef.current && autoPopupEnabled) {
    openPortal();
  }
}, 150); // 150ms de delay
```

Depois:
```typescript
const timeoutId = setTimeout(() => {
  if (!isPausedRef.current && autoPopupEnabled) {
    openPortal();
  }
}, 50); // 50ms de delay - reduzido para evitar bloqueio do navegador
```

---

### Por que essas mudancas resolvem

1. **`popup=yes`**: Diz explicitamente ao navegador para abrir como popup, nao como aba
2. **Delay reduzido**: Mantem a chamada dentro do "periodo de graca" do navegador para popups
3. **Nao mexe no modo expandido**: A feature de fullscreen continua funcionando normalmente quando usuario clica no botao de expandir

---

### Impacto

- O popup volta a abrir como janela separada pequena (comportamento anterior)
- O modo expandido (fullscreen) continua funcionando quando usuario clica no botao de maximizar
- Nao ha conflito entre as duas features
