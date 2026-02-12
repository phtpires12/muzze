
## Tela 19: "Como nos conheceu?"

### Posicionamento
Sera inserida como **Phase 2, Screen 2** -- logo apos "App Antigo" (Screen 1).
As telas seguintes se deslocam: Paywall passa para Screen 3, Install para Screen 4.

`SCREENS_PER_PHASE` muda de `[10, 4, 4]` para `[10, 4, 5]`.

### Arquivos envolvidos

**1. Novo arquivo: `src/components/onboarding/screens/phase2/Screen16ComoSoube.tsx`**

- Mesmo layout violet-themed do questionario (bg-violet-50, header com back + GradientProgressBar)
- Titulo: "Como voce nos conheceu?"
- 7 opcoes de selecao unica (apenas 1 pode ser selecionada por vez):
  - Instagram, TikTok, Youtube, App Store, Facebook, Nosso site, Amigo/Familia
- Botao "Continuar" (gradient-pill) aparece apos selecionar uma opcao
- Props: `value`, `onChange`, `onContinue`, `onBack`, `progress`

**2. Editar: `src/types/onboarding.ts`**

- Adicionar campo `referral_source?: string` ao `OnboardingData`
- Atualizar `SCREENS_PER_PHASE` de `[10, 4, 4]` para `[10, 4, 5]`
- Adicionar constante `REFERRAL_SOURCE_OPTIONS` com as 7 opcoes
- Atualizar comentarios da Phase 2

**3. Editar: `src/pages/NewOnboarding.tsx`**

- Importar `Screen16ComoSoube`
- Adicionar bloco de renderizacao para `phase === 2 && screen === 2`
- Ajustar indices: Paywall para `screen === 3`, Install para `screen === 4`

### Detalhe tecnico
Diferente da tela "App Antigo" (multi-select com limite de 3), esta tela e de **selecao unica** -- ao clicar numa opcao, as demais sao desmarcadas automaticamente. O visual dos botoes segue o mesmo padrao gradient (selecionado) vs violet (nao selecionado).
