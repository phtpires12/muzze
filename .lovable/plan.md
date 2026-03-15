

## Tornar o tipo de conteúdo editável no ContentViewPage

Atualmente o `content_type` é exibido como um `Badge` estático (linha 548-552). Vou transformá-lo em um `Select` editável, seguindo o mesmo padrão do seletor de etapa que já existe.

### Mudança única em `src/pages/content/ContentViewPage.tsx`

1. **Adicionar constante CONTENT_TYPES** no topo do arquivo (mesma lista usada no IdeaCard):
```typescript
const CONTENT_TYPES = ["Reels", "YouTube", "TikTok", "Carrossel", "Anúncio"];
```

2. **Substituir o Badge estático** (linhas 548-552) por um `Select` que atualiza `content_type` no banco:
- Visual: badge secundário clicável, mesmo estilo compacto do seletor de etapa
- Ao mudar, faz `supabase.update({ content_type })` e atualiza o estado local
- Se o novo tipo for "Carrossel", também atualiza `workflow_template` para `"carousel"`; se sair de Carrossel, volta para o workflow padrão do perfil

3. **Handler `handleContentTypeChange`**: lógica similar ao `handleStageChange` existente — update no Supabase + toast de confirmação.

### Arquivo alterado
- `src/pages/content/ContentViewPage.tsx`

