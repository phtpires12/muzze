
## O que está acontecendo (causa raiz)

O “Encerramento de sessão” está aparecendo porque a navegação **para `/editing-workspace` está sendo bloqueada** pelo hook `useNavigationBlocker`.

Hoje, o `useNavigationBlocker` (arquivo `src/hooks/useNavigationBlocker.ts`) bloqueia qualquer navegação durante uma sessão ativa, **exceto** para algumas rotas consideradas “seguras” (`SAFE_SESSION_PATHS`), como:

- `/session`
- `/shot-list/record`
- `/shot-list/review`
- `/profile`, etc.

Só que **`/editing-workspace` não está nessa lista**.

Resultado prático:
1) Você clica “Avançar pra edição” em `/shot-list/record?...`
2) O código tenta `navigate('/editing-workspace?scriptId=...')`
3) O `useBlocker` intercepta e bloqueia (porque não é rota “segura”)
4) A UI entende como “você está saindo da sessão”, abre o fluxo de confirmação/encerramento
5) Você cai no encerramento (celebrações/resumo) em vez de ir para o workspace

Isso explica exatamente o seu relato: aparece “progresso salvo / redirecionando…”, mas o redirecionamento nunca completa e você vai parar no encerramento.

---

## Correção principal (crucial para destravar o teste)

### 1) Tornar `/editing-workspace` uma rota “segura” de workflow
**Arquivo:** `src/hooks/useNavigationBlocker.ts`  
**Mudança:** adicionar `'/editing-workspace'` no array `SAFE_SESSION_PATHS`.

Com isso, quando a sessão estiver ativa e você avançar de gravação → edição, a navegação não será bloqueada e não vai disparar o modal/fluxo de encerramento.

Critério de aceite dessa etapa:
- Clicar “Avançar pra edição” em `/shot-list/record?scriptId=...` leva diretamente para:
  - `/editing-workspace?scriptId=...`
- Sem modal de “Encerrar sessão?” e sem cair no resumo/celebração por causa dessa navegação.

---

## Ajustes recomendados (para não haver outros “caminhos quebrados”)

Esses ajustes não são obrigatórios para o botão “Avançar pra edição” funcionar, mas evitam outras rotas do app continuarem empurrando o usuário para `/session?stage=edit` ou voltarem errado para review:

### 2) Corrigir “return URL” quando estágio atual é edit
**Arquivo:** `src/components/AutoHideNav.tsx`  
**Problema atual:** `getSessionReturnUrl()` para `stage === 'edit'` está devolvendo `/shot-list/review?...` ou `/session?stage=edit` (fluxo antigo).  
**Correção:** se `contentId` existir, retornar:
- `/editing-workspace?scriptId=${contentId}`
senão:
- `/editing-workspace` (ou manter `/session?stage=edit` apenas como fallback, mas ideal é padronizar no workspace)

### 3) Atualizar pontos do app que ainda navegam para `/session?stage=edit`
Pelo search atual, ainda existem referências em:
- `src/components/BottomNav.tsx` (continueProject case "edit" e startSession("edit") -> `/session?stage=edit`)
- `src/components/home/ContinuityCarousel.tsx` (quando stage === "editing")
- possivelmente `src/components/SideNav.tsx` (aparece no search)

**Objetivo:** quando o destino for “editing”, navegar para:
- `/editing-workspace?scriptId=${scriptId}` (quando tiver scriptId)
e evitar o `/session?stage=edit` como destino principal.

Critérios de aceite desses ajustes:
- “Continuar projeto” que esteja em edição leva para o Editing Workspace (com `scriptId`).
- Home/Continuity (atalhos de retomar) também levam ao Editing Workspace.
- Nenhum fluxo normal de edição depende de `/session?stage=edit` (pode existir como compatibilidade, mas não como caminho principal).

---

## Instrumentação rápida (para confirmar que era o blocker)
Enquanto implementamos, eu também vou adicionar logs pontuais (somente console/dev) para confirmar:
- quando o blocker bloqueou
- qual era `nextLocation.pathname`
- se caiu no callback do modal por bloqueio

(Respeitando o padrão do projeto: debug centralizado, sem vazar em tela para usuário final.)

---

## Sequência de implementação (bem direta)

1) Editar `useNavigationBlocker.ts`: incluir `/editing-workspace` em `SAFE_SESSION_PATHS`.  
2) Testar o fluxo exato que você está agora:
   - rota atual: `/shot-list/record?scriptId=16df85c3-0d31-49bd-898b-05257544d7b2`
   - clicar “Avançar pra edição”
   - confirmar que chega em `/editing-workspace?scriptId=...` sem encerramento
3) Se ok, aplicar ajustes de consistência:
   - `AutoHideNav.tsx` return URL de edit
   - `BottomNav.tsx`, `ContinuityCarousel.tsx`, `SideNav.tsx` para apontar para `/editing-workspace`
4) Rodar um teste ponta-a-ponta:
   - abrir conteúdo → shotlist → gravação → avançar → editar no workspace → marcar como editado

---

## Riscos/observações

- Essa correção mexe na regra de bloqueio de navegação. O efeito desejado é: **não tratar o Editing Workspace como “sair da sessão”**, e sim como “continuar o workflow”.
- Se existirem outras rotas novas de workflow no futuro, elas também devem entrar em `SAFE_SESSION_PATHS`, para não repetir esse bug.

---

## Definição de pronto (DoD)

- [ ] “Avançar pra edição” nunca cai no encerramento por bloqueio de navegação
- [ ] `/editing-workspace?scriptId=...` abre corretamente a página
- [ ] O timer/sessão continuam ativos ao trocar de gravação → edição
- [ ] Rotas secundárias (continuar projeto / atalhos) também levam para o workspace quando o estágio é edição
