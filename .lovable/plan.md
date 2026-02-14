

## Correção: Botão "Continuar" na tela "Ofensiva Protegida"

### Problema
O componente `StreakProtectedCelebration` usa um estado interno `isVisible` que e setado para `true` quando `show=true`, mas nunca volta para `false`. Quando o usuario clica "Continuar", o `onContinue` do pai seta `show=false`, porem o `isVisible` interno permanece `true`, mantendo a tela visivel indefinidamente.

### Solução
Editar `src/components/StreakProtectedCelebration.tsx`:

- Adicionar um `useEffect` que observa quando `show` muda para `false` e reseta `isVisible` para `false`

### Arquivo afetado
`src/components/StreakProtectedCelebration.tsx` -- adicionar logica para sincronizar `isVisible` com `show`

