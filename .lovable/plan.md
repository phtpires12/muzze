
## Modo Cliente — UX simplificada para o plano Studio

Criar um novo papel **`client`** no workspace, exclusivo do plano Studio. Quando esse usuário fizer login, ele cai numa **interface própria, separada do app principal**, focada em ver, aprovar e comentar nos conteúdos das etapas que o social media liberou para ele.

---

### 1. Modelo de dados

**Migration única:**

- Adicionar `'client'` ao enum `workspace_role` (hoje: owner / admin / collaborator).
- Criar tabela `script_comments` para o fluxo de "pedir ajustes":
  - `id`, `script_id`, `user_id` (autor), `workspace_id`, `content` (text), `resolved` (bool), `created_at`.
  - RLS: membros do workspace leem; cliente só insere/lê próprios comentários nos scripts visíveis a ele.
- Atualizar a função `can_edit_stage` / `can_use_timer` para que `'client'` siga a mesma lógica de `collaborator` (usa `allowed_timer_stages` / `can_edit_stages` já existentes — reaproveitamos os arrays para definir **quais etapas o cliente vê**, ex: `['recording']`).
- Adicionar coluna `client_approved_at` em `scripts` (timestamp). Quando o cliente clica "Marquei como gravado", salva aqui.
- Garantir que o limite de convites do tipo `client` só seja permitido para workspaces cujo dono tem `plan_type = 'studio'` (validação na função `inviteMember` + check no banco via trigger no `workspace_invites`).

### 2. Convite e gestão (lado do owner / social media)

Atualizar o modal de convite (`MemberPermissionsModal.tsx`) e a página `/guests`:

- Adicionar opção de papel **"Cliente"** no seletor de role — só aparece se o plano for Studio. Em outros planos, mostra um upsell.
- Ao escolher "Cliente", a UI muda para uma versão simplificada: o owner só seleciona **quais etapas o cliente verá** (checkboxes: Ideação, Roteiro, Revisão, **Gravação** [pré-marcada], Edição, Design). Reusa o array `allowed_timer_stages` que já existe.
- Email de convite mantém o fluxo atual (`send-invite-email` edge function), só ajustar o texto para clientes.

### 3. Roteamento e detecção do papel

Em `RouterComponents.tsx > ProtectedRoute`:

- Após carregar o profile, checar o role do usuário no workspace ativo via `get_workspace_role`.
- Se for `'client'`, **redirecionar para `/cliente`** e bloquear acesso às rotas normais (`/`, `/calendario`, `/session`, etc).
- Adicionar nova rota `ROUTES.CLIENT_HOME = '/cliente'` em `src/routes/routes.ts`.

### 4. Nova UX do cliente

Criar pasta `src/pages/client/` com:

**`ClientLayout.tsx`** — shell simples, sem `AppNavigation` pesado:
- Header com logo + nome do workspace + avatar (logout).
- Bottom nav minimalista mobile / sidebar slim desktop com 2 abas:
  1. **"Para gravar"** (ícone câmera) → `/cliente`
  2. **"Calendário"** (ícone calendar) → `/cliente/calendario`

**`ClientHomePage.tsx`** (`/cliente`) — quadro principal:
- Lista vertical de cards dos scripts que estão **nas etapas liberadas** para esse cliente (filtro por `stage_progress` + `allowed_timer_stages`).
- Cada card mostra: thumbnail, título, ideia central, tipo de conteúdo, **shot list** e roteiro expansível.
- 2 botões grandes no card:
  - **"Marquei como gravado"** → seta `client_approved_at = now()` e move o script para a próxima etapa do workflow (mesma lógica do botão "Próxima etapa" já existente).
  - **"Pedir ajuste"** → abre sheet/modal com textarea, salva em `script_comments`. Toast confirma envio.
- Estado vazio amigável: "Nenhum conteúdo te aguardando agora 🎬".

**`ClientCalendarPage.tsx`** (`/cliente/calendario`) — read-only:
- Calendário mensal simplificado (reusa `CompactCalendar` ou `WeekCalendar` existente).
- Mostra só scripts com `publish_status = 'postado'` ou `published_at != null`.
- Clique no card abre um drawer apenas de visualização (título, thumb, link do post se houver). Sem edição.

**`src/components/client/ClientScriptCard.tsx`** — componente do card grande, otimizado para mobile (já que cliente provavelmente vai usar pelo celular).

### 5. Visibilidade de comentários para o social media

No `ContentViewPage.tsx` (visão do owner/social media), adicionar uma seção **"Comentários do cliente"** que lista os `script_comments` daquele script, com botão para marcar como resolvido. Assim o social media vê os pedidos de ajuste e age.

### 6. Restrição por plano

- No hook `usePlanContext` (ou equivalente), expor `canInviteClients = planType === 'studio'`.
- Em `/guests`, esconder/desabilitar a opção "Cliente" quando `!canInviteClients`, com CTA "Faça upgrade para Studio".
- Backend: trigger em `workspace_invites` que rejeita inserts com `role = 'client'` se o owner não for Studio (defesa em profundidade).

---

### Diagrama de fluxo

```text
Social Media (Studio)              Cliente
       |                              |
       | convida com role='client'    |
       | + etapas: [recording]        |
       |----------------------------->|
       |                              | aceita convite, faz login
       |                              |
       |                              v
       |                         /cliente (auto-redirect)
       |                              |
       |                         [Quadro: scripts em gravação]
       |                              |
       |        cliente clica         |
       |        "Marquei gravado"     |
       |<-----------------------------|
       | script avança p/ edição      |
       |                              |
       |        OU "Pedir ajuste"     |
       |<-----------------------------|
       | comentário aparece em        |
       | ContentViewPage              |
```

---

### Arquivos criados / modificados

**Novos:**
- `supabase/migrations/...` — enum + tabela `script_comments` + coluna `client_approved_at` + triggers.
- `src/pages/client/ClientLayout.tsx`
- `src/pages/client/ClientHomePage.tsx`
- `src/pages/client/ClientCalendarPage.tsx`
- `src/pages/client/index.ts`
- `src/components/client/ClientScriptCard.tsx`
- `src/components/client/CommentSheet.tsx`
- `src/core/hooks/useClientScripts.ts`

**Modificados:**
- `src/routes/routes.ts` — adicionar `CLIENT_HOME`, `CLIENT_CALENDAR`.
- `src/routes/index.tsx` — registrar rotas do cliente.
- `src/components/routing/RouterComponents.tsx` — redirect baseado em role.
- `src/components/content/workspace/MemberPermissionsModal.tsx` — opção "Cliente" + gating Studio.
- `src/pages/settings/GuestsPage.tsx` — UI do convite cliente.
- `src/types/workspace.ts` — `WorkspaceRole` inclui `'client'`.
- `src/core/hooks/useWorkspace.ts` — suporta o novo role.
- `src/pages/content/ContentViewPage.tsx` — seção de comentários do cliente.

### Fora do escopo desta entrega
- Notificações push para o cliente quando há novo conteúdo (pode ser próximo passo).
- Cliente conseguir gravar e fazer upload do vídeo direto no app (escopo bem maior).
