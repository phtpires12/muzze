
## Objetivo
Remover completamente (da versão web) a funcionalidade “Timer em Janela / Popup”, incluindo:
- abertura/foco automático ao trocar de aba
- CTA/tooltip de ativação
- switch de configurações (“Timer Popup Automático”)
- hooks/arquivos e chaves de localStorage associadas
- modo `isPopup` no `DraggableSessionTimer` (já que ficará sem uso)

Resultado esperado: o timer volta a existir somente “dentro” do web app (draggable + modo expandido/fullscreen), sem qualquer tentativa de abrir janela/guia externa.

---

## O que será removido (inventário)
### Arquivos criados especificamente para o popup (excluir)
1) `src/hooks/useWindowPortal.tsx`
2) `src/components/TimerWindowActivator.tsx`
3) `src/hooks/useTimerPopupSettings.ts`

Esses três ficam sem utilidade após a remoção e hoje são o núcleo/UX/config do recurso.

### Pontos de integração a limpar (remover import/lógica/JSX)
1) `src/pages/Session.tsx`
   - Remover imports: `useWindowPortal`, `TimerWindowActivator`, e o `useAppVisibility` (confirmado que só era usado para isso nessa página).
   - Remover toda a seção “Window portal system” (criação do portal, handlers, efeitos).
   - Remover renderizações `<Portal> ... isPopup={true} ... </Portal>`
   - Remover `<TimerWindowActivator ... />`
   - Ajustar as condições `!isOpen && (...)` para sempre renderizar o timer interno (ou simplesmente remover a condição e renderizar direto).

2) `src/pages/ShotListRecord.tsx`
   - Remover imports: `useWindowPortal`, `TimerWindowActivator` (e manter `useAppVisibility` somente se existir uso adicional; caso só seja para popup aqui também, remover).
   - Remover bloco de lógica de visibilidade que chama `openPortal({reason:'auto'})`.
   - Remover `<Portal>...isPopup={true}...</Portal>` e `<TimerWindowActivator />`
   - Remover condicionais baseadas em `isOpen` que escondiam o timer interno.

3) `src/pages/ShotListReview.tsx`
   - Mesma limpeza de popup (imports, lógica e JSX).

4) `src/pages/Settings.tsx`
   - Remover import do `useTimerPopupSettings`
   - Remover o switch “Timer Popup Automático” (linhas ~98–112 no arquivo atual)
   - Ajustar layout/spacing do card de preferências após remover esse item

### Componente do timer: remover modo popup (limpeza para não “sobrar” feature morta)
5) `src/components/DraggableSessionTimer.tsx`
   - Remover prop `isPopup?: boolean`
   - Remover o bloco inteiro `if (isPopup) { ... }` (renderização centralizada “popup mode”)
   - Remover qualquer chamada `isPopup={true}` (já removidas nas páginas acima)
   - Garantir que o modo “Expanded/Fullscreen” continue igual (ele é interno ao timer e não depende do popup)

---

## Limpeza de dados do usuário (localStorage)
Hoje existem chaves relacionadas ao recurso:
- `timer-popup-activated`
- `timer-auto-popup-enabled`

Como você pediu para “excluir esses dados”, faremos a limpeza de forma segura no web app:
- Remover todas as leituras/escritas dessas chaves no código (ao remover os arquivos/hooks e efeitos isso já acontece).
- Adicionar uma limpeza pontual em um ponto central da aplicação (ex: `App.tsx` ou `main.tsx`) para remover essas chaves na inicialização (apenas uma vez), para não ficar lixo persistido em usuários que já ativaram/configuraram.  
  Observação: isso não afeta nenhum outro recurso do app.

---

## Sequência de implementação (para evitar quebrar build)
1) Remover integrações nas páginas (Session / ShotListRecord / ShotListReview / Settings) primeiro:
   - tirar imports e referências a `useWindowPortal`, `TimerWindowActivator`, `useTimerPopupSettings`
   - remover JSX `<Portal>` e o CTA
   - ajustar render do timer interno para sempre aparecer na página

2) Atualizar `DraggableSessionTimer`:
   - remover prop e bloco `isPopup`
   - garantir TypeScript/props corretos em todos os lugares onde o timer é usado

3) Remover arquivos agora órfãos:
   - deletar `useWindowPortal.tsx`, `TimerWindowActivator.tsx`, `useTimerPopupSettings.ts`

4) Adicionar limpeza das chaves do localStorage no bootstrap do app:
   - removeItem das duas chaves ao iniciar

5) Rodar um “check” mental/compilação (na prática, após implementar, o preview deve subir sem erros):
   - garantir que não ficou nenhum import quebrado
   - garantir que não existe mais `window.open` do timer em nenhum lugar
   - confirmar que Settings compila sem o hook removido

---

## Critérios de aceite (testes end-to-end)
1) Em `/session?stage=edit&scriptId=...`:
   - não aparece mais card/tooltip “Timer em Janela”
   - ao trocar de aba/minimizar, não abre nova guia nem janela
   - timer continua funcionando normal no canto (draggable) e modo expandido continua funcionando

2) Em `/shot-list/review?scriptId=...` e `/shot-list/record?scriptId=...`:
   - mesma validação: nada abre ao trocar de aba
   - timer continua presente e funcional

3) Em `/settings`:
   - não existe mais a opção “Timer Popup Automático”
   - página renderiza sem buracos de layout

---

## Observações importantes (alinhamento com sua decisão)
- Isso remove a feature do web app para não frustrar o usuário com comportamento inconsistente do navegador.
- Mantém o timer e o modo expandido (fullscreen) dentro do próprio web app.
- Quando você for retomar a ideia no app nativo para Mac, a implementação será outra (fora das limitações de popup do navegador) e não depende desse código.

---

## Lista consolidada de arquivos que serão alterados/removidos
### Alterar
- `src/pages/Session.tsx`
- `src/pages/ShotListRecord.tsx`
- `src/pages/ShotListReview.tsx`
- `src/pages/Settings.tsx`
- `src/components/DraggableSessionTimer.tsx`
- (um arquivo central para limpeza do localStorage, a definir após ver onde faz mais sentido: `src/App.tsx` ou `src/main.tsx`)

### Remover
- `src/hooks/useWindowPortal.tsx`
- `src/components/TimerWindowActivator.tsx`
- `src/hooks/useTimerPopupSettings.ts`
