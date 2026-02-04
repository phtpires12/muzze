
## Contexto (o que está acontecendo de verdade)
Pelos trechos atuais do código, o fluxo “permissão 1x” foi implementado corretamente no conceito (abrir por clique, focar automaticamente). O problema principal que faz o Chrome abrir como **guia** em vez de **janela popup** não é o delay da visibilidade — é que o `window.open()` no modo **user** está sendo executado **dentro de um `setTimeout`** no `useWindowPortal`.

No Chrome, **qualquer `window.open()` que não aconteça imediatamente dentro do handler do clique** perde o “user gesture context” e vira:
- bloqueado, ou
- aberto como guia, ou
- comportamento inconsistente.

Hoje, mesmo com `reason: 'user'`, o `useWindowPortal` faz:
- clique -> `openPortal({reason:'user'})`
- `openPortal` -> `setTimeout(() => window.open(...), 50)`

Isso quebra o requisito de gesto do usuário.

Além disso, a tooltip está enganosa porque promete “aparece quando trocar de aba”, mas na prática o auto-focus só acontece quando:
- `session.isActive === true`
- `session.isPaused === false` (timer “rodando”)
- `timer-popup-activated === true`
- e existe uma janela já aberta (handle vivo)

Então a percepção “só roda se o timer estiver rodando” é verdadeira para o auto-focus — e a UI precisa comunicar isso com clareza.

## Objetivo
1) Garantir que **ao clicar** em “Ativar Timer em Janela” o timer abra como **janela popup** (não guia) no Chrome desktop.
2) Ajustar a tooltip/copy para refletir o comportamento real:
   - “quando você trocar de aba, essa janela será trazida para frente” (focus),
   - e isso só acontece “enquanto o timer estiver rodando”.
3) Manter o fluxo “auto” sem abrir nada (só focar se já existir), evitando criação de guias na saída de aba.

## Mudanças propostas (alta confiança)
### A) Tornar o `window.open()` 100% síncrono no clique (remover `setTimeout` no modo user)
**Arquivo:** `src/hooks/useWindowPortal.tsx`

**O que mudar:**
- No `openPortal({ reason: 'user' })`, chamar `window.open(...)` imediatamente, sem `setTimeout`.
- Separar a parte “abrir janela” (síncrono) da parte “injetar estilos / criar container / setIsOpen(true)” (pode continuar síncrono logo em seguida; se precisar, usar `queueMicrotask`/`requestAnimationFrame` apenas para DOM setup, mas mantendo o `window.open` dentro do clique).
  
**Resultado esperado:**
- Chrome passa a tratar como popup (muito mais consistente).

### B) Reavaliar o BroadcastChannel “close-all-popups” para não prejudicar a abertura
**Arquivo:** `src/hooks/useWindowPortal.tsx`

**Problema atual:**
- O hook envia `close-all-popups` antes de abrir, e ainda espera 50ms. Além de quebrar o gesto, esse “orquestrador” pode criar estados estranhos.

**O que vamos fazer:**
- Remover a necessidade de `close-all-popups` no fluxo normal.
- Confiar primeiro no comportamento padrão do `window.open` com o mesmo `name` (`timer-popup`) que tende a reutilizar/focar a mesma janela.
- Manter `close-orphan-popups` apenas se realmente for necessário; caso esteja atrapalhando, simplificar (preferência: estabilidade do popup no clique).

### C) Ajustar a cópia da tooltip para não prometer “abrir”
**Arquivo:** `src/components/TimerWindowActivator.tsx`

**Novo texto sugerido (exemplo):**
- Título: “Timer em Janela”
- Descrição: “Clique uma vez para abrir a janela. Enquanto o timer estiver rodando, ao trocar de aba a janela será trazida para frente.”

Isso alinha a expectativa com o comportamento real (focus, não “spawn”).

### D) Ajustar a lógica “só funciona rodando” (decisão de produto + pequena mudança)
Hoje o auto-focus não roda se estiver pausado (isso faz sentido para não “incomodar” o usuário). Mas a UX está confusa.

Vamos escolher uma das opções (recomendação: manter como está e apenas comunicar):
1) **Manter regra atual** (auto-focus só quando rodando) + corrigir texto.
2) Alternativa: permitir auto-focus mesmo pausado, mas isso pode ser irritante e não resolve a abertura.

Neste plano eu implemento a opção (1), que resolve a reclamação sem mudar a filosofia do timer.

## Onde mais checar (para garantir que não há “outro lugar” abrindo guia)
Mesmo com o `auto` protegido, vamos verificar se há outro `window.open()` sendo acionado em páginas relacionadas:
- `src/pages/ShotListRecord.tsx`
- `src/pages/ShotListReview.tsx`
- (busca global por `window.open(`)

Se existir algum `window.open` fora do `useWindowPortal`, ele pode ser o causador de guias.

## Critérios de sucesso (testes E2E no Chrome desktop)
1) Abrir `/session?...` e clicar “Ativar Timer em Janela”
   - Deve abrir uma **janela** (popup) redimensionável/minimizável (não uma guia).
2) Voltar para a aba principal, deixar o timer rodando e trocar de aba
   - A janela do timer deve ser **focada** (trazida à frente), sem criar guia nova.
3) Pausar o timer e trocar de aba
   - Não deve focar/abrir nada (e a tooltip deve deixar isso claro).
4) Fechar a janela manualmente e trocar de aba
   - Não deve abrir guia nova; ao voltar, o CTA deve voltar a aparecer para reativar.

## Risco/limite honesto (para decidir “não fazer”)
Mesmo com a correção síncrona, existe um limite: se o usuário tiver configurações/extensões que forçam popups virarem abas, pode continuar abrindo como guia.  
Por isso, após o ajuste síncrono, se ainda virar guia:
- vamos considerar a feature “inconfiável no ambiente do usuário” e recomendar desativar o auto-popup (ou remover o recurso) até o app nativo para Mac.

## Entregáveis (arquivos a alterar)
- `src/hooks/useWindowPortal.tsx`
  - Remover `setTimeout` do modo `reason: 'user'` e abrir popup de forma síncrona
  - Simplificar/ajustar lógica de BroadcastChannel para não atrapalhar
- `src/components/TimerWindowActivator.tsx`
  - Ajustar texto para “focar ao trocar de aba” e “somente enquanto rodando”
- (Opcional, se necessário) `src/pages/Session.tsx`, `ShotListRecord.tsx`, `ShotListReview.tsx`
  - Apenas se encontrarmos algum `window.open` extra ou lógica duplicada fora do hook

## Notas técnicas (por que isso deve resolver)
- O único jeito confiável de forçar popup no Chrome é: `window.open()` acontecer **sincronamente** no clique.
- Todo `setTimeout`, `await`, Promise, ou efeito assíncrono antes do `window.open` tende a quebrar o “user gesture”.
- Portanto, reduzir delay (50ms/150ms) não resolve; remover o atraso no caminho do clique resolve.
