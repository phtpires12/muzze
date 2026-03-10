

## Navegação entre conteúdos do mesmo dia

O ContentViewPage atualmente carrega apenas 1 script pelo `scriptId` da URL. A ideia é buscar todos os scripts do mesmo `publish_date` e permitir navegar entre eles com setas (prev/next) no header e swipe horizontal.

### Implementação

**ContentViewPage.tsx** — mudanças:

1. **Após carregar o script principal**, fazer uma segunda query buscando todos os scripts com o mesmo `publish_date` e `user_id`:
```typescript
const { data: siblings } = await supabase
  .from('scripts')
  .select('id, title, status, content_type')
  .eq('publish_date', script.publish_date)
  .eq('user_id', userId)
  .order('created_at');
```

2. **Adicionar estado** para a lista de siblings e o índice atual:
```typescript
const [siblings, setSiblings] = useState<{id: string; title: string}[]>([]);
const currentIndex = siblings.findIndex(s => s.id === scriptId);
```

3. **No header**, entre o botão voltar e o "Modo Visualização", mostrar um indicador de posição e setas de navegação:
```text
[ ← ]  [ ◀ 3/7 ▶ ]  Modo Visualização  [ 🗑 ]
```
- Setas `ChevronLeft` / `ChevronRight` para navegar
- Indicador "3 de 7" mostrando posição atual
- Ao clicar, faz `navigate(/content/view/${siblings[newIndex].id})` — o `useEffect` já recarrega o script pelo `scriptId`

4. **Swipe horizontal** (opcional, mobile-friendly): usar touch events simples (`onTouchStart`, `onTouchEnd`) no container principal para detectar swipe e navegar para prev/next.

5. **Condição**: o bloco de navegação só aparece quando `siblings.length > 1` e o script tem `publish_date` definido.

### Arquivos alterados
- `src/pages/content/ContentViewPage.tsx` — toda a lógica fica neste arquivo

### UX
- As setas ficam desabilitadas nos extremos (primeiro/último)
- O indicador "3 de 7" dá contexto de quantos conteúdos tem no dia
- A navegação é instantânea pois usa `navigate()` e o `useEffect` já depende de `scriptId`

