

# Fix: Erro "Should have a queue" causando tela branca

## Problema

O hook `useRegisterSW` do `vite-plugin-pwa` crasha no ambiente de preview do Lovable porque service workers nao funcionam dentro do iframe. O erro "Should have a queue" e um bug interno do React disparado quando o `useRegisterSW` tenta usar `useState` em um contexto invalido.

Como `usePWAUpdate` e chamado diretamente no componente `App`, o crash derruba o app inteiro (tela branca).

## Solucao

Tornar o `usePWAUpdate` resiliente: verificar se service workers estao disponiveis antes de chamar `useRegisterSW`. Se nao estiverem, retornar valores default sem registrar nada.

## Mudanca

### `src/hooks/usePWAUpdate.ts`

Separar em dois componentes internos:

1. Um hook `usePWAUpdateInternal` que contem toda a logica atual (com `useRegisterSW`)
2. O hook `usePWAUpdate` exportado que verifica se o ambiente suporta SW:
   - Se `navigator.serviceWorker` nao existe: retorna valores neutros (sem crash)
   - Se existe: delega para `usePWAUpdateInternal`

**Problema**: Nao podemos chamar hooks condicionalmente em React. Entao a solucao correta e criar um **componente wrapper** ou usar um pattern diferente.

**Abordagem escolhida**: Envolver a chamada a `useRegisterSW` em um `try-catch` nao funciona com hooks. Entao vamos:

1. Criar um componente `PWAUpdateProvider` que renderiza condicionalmente
2. Ou, mais simples: mover o `usePWAUpdate` para dentro de um componente filho que so monta quando SW esta disponivel

**Abordagem final (mais simples e sem quebrar a arquitetura)**:

No `App.tsx`, envolver o uso de `usePWAUpdate` em um componente separado que so monta se service workers estao disponiveis. Isso evita que o `useRegisterSW` seja chamado em ambientes sem suporte.

### Arquivo: `src/App.tsx`

- Extrair a logica de PWA update para um componente `PWAManager` separado
- Esse componente so renderiza o `UpdateOverlay` se necessario
- No `App`, renderizar `<PWAManager />` em vez de chamar `usePWAUpdate()` diretamente
- O `PWAManager` faz a verificacao de suporte a SW antes de montar

```tsx
const PWAManager = () => {
  // Only run in environments that support service workers
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  return <PWAManagerInner />;
};

const PWAManagerInner = () => {
  const { needRefresh } = usePWAUpdate();
  return <UpdateOverlay isVisible={needRefresh} />;
};
```

**Nota**: O check condicional antes de renderizar `PWAManagerInner` garante que `useRegisterSW` nunca e chamado em ambientes sem SW.

### Arquivo: `src/hooks/usePWAUpdate.ts`

- Adicionar guard no `useEffect` de cleanup para verificar se `navigator.serviceWorker` existe antes de acessar `.getRegistrations()`

## Resultado

- No preview do Lovable (sem SW): app carrega normalmente, sem crash
- Em producao (com SW): comportamento identico ao atual
- Tela branca eliminada

