
## Diagnóstico (o que mudou e por que ficou pior)
Hoje o “timer em janela” é acionado quando o usuário troca de aba/minimiza (Page Visibility API). Esse disparo acontece dentro de um `useEffect` (ou seja: **não é um clique do usuário**).

No Chrome desktop, quando `window.open()` acontece sem “user gesture” (clique/tecla), o navegador pode:
- bloquear,
- ou abrir como **nova guia** em vez de **janela popup**,
- ou aplicar heurísticas inconsistentes.

Então o problema não é “a velocidade” do delay (50ms vs 150ms). O problema é **quem está abrindo**: um efeito automático sem gesto do usuário. Reduzir o delay só fez a guia aparecer “mais rápido”, mas continua sendo guia.

## Objetivo do ajuste
Garantir que o Draggable Timer volte ao comportamento “correto” no Chrome:
- abrir como **janela** (popup), não guia,
- permitir minimizar, colocar em tela cheia, fechar,
- manter o novo modo fullscreen (expandir) **dentro do timer**, sem quebrar o sistema de janela.

## Abordagem escolhida (sua preferência): “Pedir permissão 1x”
Vamos implementar um fluxo de “ativação” em que o usuário clica **uma vez** em um botão para autorizar/abrir a janela.
A partir daí:
- quando o usuário sair da aba, nós **não criamos** uma nova janela do nada;
- nós apenas **focamos a janela já aberta** (isso é permitido e consistente);
- se o usuário fechar a janela manualmente, a automação para de funcionar até ele ativar de novo.

Isso é o único jeito confiável de garantir popup no Chrome, por limitações do navegador.

## Mudanças de comportamento (explicadas de forma clara)
1) Enquanto o usuário estiver na aba principal, a janela do timer pode ficar aberta (o usuário pode minimizar/mandar para outro monitor).
2) Ao sair da aba principal, o app “traz” o foco para a janela do timer (se ela existir).
3) Ao voltar para a aba principal, o app não tenta fechar a janela automaticamente (para não perder a permissão/handle e não reabrir como guia).

## Implementação (o que vamos mudar no código)

### 1) `useWindowPortal.tsx`: separar “abrir por clique” vs “abrir automático”
Hoje `openPortal()` abre uma janela sempre que não existe. Vamos alterar para suportar dois modos:

- `openPortal({ reason: 'user' })`: abre a janela (chamado por clique em botão).
- `openPortal({ reason: 'auto' })`: **não abre uma nova janela**. Se a janela já existe, apenas `focus()`. Se não existe, não faz nada.

Isso impede que o `useEffect` (saída da aba) crie uma nova guia.

Também vamos expor um helper do tipo:
- `hasOpenWindow()` (true/false) para as páginas saberem se a janela está aberta.

### 2) `Session.tsx`, `ShotListRecord.tsx`, `ShotListReview.tsx`: adicionar o “botão de ativação”
Em todas as telas onde existe autopopup hoje, vamos adicionar uma UI simples quando a sessão estiver ativa:

- Estado persistido em `localStorage`: `timer-popup-activated` (boolean)
- Um botão pequeno próximo do timer (ou em um local discreto fixo) com texto tipo:
  - “Ativar Timer em Janela”
  - subtexto: “Clique uma vez para permitir. Depois ele aparece quando você sair da aba.”

Ao clicar:
- chamamos `openPortal({ reason: 'user' })` (gera a janela como popup),
- marcamos `timer-popup-activated=true`,
- mostramos um toast explicando “Pode minimizar essa janela; ela vai servir como timer flutuante”.

### 3) Lógica de visibilidade: não criar janela no automático
Nos efeitos que hoje fazem:
- “se saiu da aba -> `openPortal()`”

Vamos mudar para:
- se saiu da aba:
  - se `timer-popup-activated=true`: `openPortal({ reason: 'auto' })` (foca apenas se já existir)
  - senão: não abre nada

Ao voltar para a aba:
- em vez de `closePortal()` sempre, vamos **parar de fechar automaticamente** (para manter a janela “autorizada” viva).
- (Opcional) podemos só “desfocar” a janela se existir, mas sem fechar.

### 4) Mensagens/feedback para reduzir confusão
- Se o usuário nunca ativou: ao sair da aba não acontece nada (por design).
- Se ele ativou, mas fechou a janela: ao voltar para a aba principal mostramos um toast:
  - “A janela do timer foi fechada. Clique em ‘Ativar Timer em Janela’ para abrir novamente.”

## Arquivos que serão modificados
- `src/hooks/useWindowPortal.tsx`
  - adicionar modo `reason: 'user' | 'auto'`
  - não abrir janela em modo auto quando não existe handle
  - expor `hasOpenWindow()`
- `src/pages/Session.tsx`
  - adicionar botão “Ativar Timer em Janela”
  - ajustar `useEffect` de visibilidade para não abrir popup automaticamente
  - remover/ajustar `closePortal()` ao voltar visível (para não matar a permissão)
- `src/pages/ShotListRecord.tsx`
  - mesma lógica/UX do Session
- `src/pages/ShotListReview.tsx`
  - mesma lógica/UX do Session

## Riscos e como vamos tratar
- “Mas antes abria sozinho”: no Chrome isso é instável e vira guia. Com a ativação 1x fica confiável.
- Usuário fecha a janela sem querer: o sistema detecta “sem janela” e pede reativação.
- Expansão fullscreen do timer: continua funcionando, pois é dentro do componente e independe de abrir janela vs guia.

## Checklist de testes (end-to-end)
1) Em `/session?...`, clicar “Ativar Timer em Janela” e confirmar que abre **janela** (não guia).
2) Minimizar a janela; voltar para a aba principal e continuar trabalhando.
3) Trocar de aba: confirmar que a janela do timer é focada/mostrada (sem criar nova guia).
4) Fechar a janela manualmente e trocar de aba: confirmar que **não abre guia**; ao voltar, aparece toast pedindo reativação.
5) Testar também em:
   - `/shot-list/record?scriptId=...`
   - `/shot-list/review?scriptId=...`

## Resultado esperado
- Zero “timer abrindo como guia” (porque o automático não cria mais janela).
- Popup consistente no Chrome desktop após ativação 1x.
- O modo fullscreen novo continua disponível pelo botão de expandir no timer.
