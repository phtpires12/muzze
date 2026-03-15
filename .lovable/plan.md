

## Adicionar seletor de status de publicação no ContentViewPage

Atualmente o `publish_status` é exibido como um `Badge` estático (linhas 597-601). Vou transformá-lo em um `Select` editável, seguindo o mesmo padrão visual dos seletores de etapa e tipo de conteúdo já existentes.

### Mudança única em `src/pages/content/ContentViewPage.tsx`

1. **Substituir o Badge estático de publish_status** (linhas 597-601) por um `Select` com as 4 opções: Planejado, Pronto para postar, Postado, Perdido.

2. **Adicionar handler `handlePublishStatusChange`** seguindo o padrão dos outros handlers:
   - Atualiza `publish_status` no banco
   - Se o novo status for `"postado"`, também define `published_at = now()`
   - Se sair de `"postado"`, limpa `published_at`
   - Atualiza estado local + toast de confirmação

3. **Visual**: usar as cores já definidas em `getPublishStatusClass` para o trigger do Select, mantendo o estilo compacto (h-7, text-xs, rounded-full) consistente com os outros seletores.

### Arquivo alterado
- `src/pages/content/ContentViewPage.tsx`

