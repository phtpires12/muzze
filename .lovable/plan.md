

## Confirmacao de compra de bloqueio: dialog apenas na primeira compra + sem reload

### Comportamento desejado

1. **Primeira compra da sessao**: mostra um dialog compacto explicando o que e o bloqueio, quantidade atual, XP gasto/restante
2. **Compras seguintes (na mesma visita a pagina)**: apenas atualiza os numeros na tela silenciosamente (sem dialog, sem toast, sem reload)
3. **Nunca recarregar a pagina**: o perfil e atualizado em memoria via `refetch()` do ProfileContext

### Detalhes tecnicos

**Arquivo alterado: `src/pages/Ofensiva.tsx`**

1. **Adicionar estado para controlar se o dialog ja foi mostrado**:
   - `const [hasShownFreezeDialog, setHasShownFreezeDialog] = useState(false)`
   - `const [freezePurchaseInfo, setFreezePurchaseInfo] = useState<{ newTotal: number; xpSpent: number; xpRemaining: number } | null>(null)`

2. **Modificar `handleBuyFreeze`**:
   - Remover `window.location.reload()`
   - Remover o `toast.success`
   - Apos compra bem-sucedida, chamar `refetch()` do `useProfileWithLevel` (que ja expoe essa funcao via ProfileContext)
   - Se `hasShownFreezeDialog === false`: setar `freezePurchaseInfo` com os dados da compra (abre o dialog)
   - Se `hasShownFreezeDialog === true`: nao fazer nada visual (os numeros ja atualizam automaticamente via refetch + realtime)

3. **Renderizar um Dialog (shadcn/ui)**:
   - Controlado por `freezePurchaseInfo !== null`
   - Conteudo: icone de escudo cyan, titulo "Bloqueio adquirido!", quantidade X/5, XP gasto e restante, explicacao curta
   - Ao fechar: `setFreezePurchaseInfo(null)` e `setHasShownFreezeDialog(true)`

4. **Garantir que `refetch` atualiza os dados na tela**:
   - O hook `useProfileWithLevel` ja expoe `refetch` vindo do ProfileContext
   - O ProfileContext tambem tem um listener realtime na tabela profiles que atualiza o estado automaticamente
   - Isso garante que os numeros de XP e freezes na tela se atualizam sem reload

### Resultado

- Compra 1: dialog informativo aparece
- Compras 2, 3, 4, 5: numeros atualizam silenciosamente na tela, sem interrupcao
- Zero reloads em qualquer cenario
