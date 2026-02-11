

# Tela 18 - App Antigo (Questionario Multi-Select)

## O que sera construido
Uma nova tela de questionario multi-select perguntando "Onde voce costumava organizar seu conteudo?", com limite de 3 selecoes, seguindo o padrao visual ja estabelecido (violet theme, gradiente nos selecionados, barra de progresso gradiente).

## Posicao no fluxo
A tela sera inserida como **Phase 1, Screen 3** (logo apos CreationTime). A Phase 1 passara de 3 para 4 telas.

## Mudancas tecnicas

### 1. Novo componente: `src/components/onboarding/screens/phase1/Screen14PreviousTools.tsx`
- Segue o padrao exato do `Screen6StickingPoints.tsx`
- Header com botao voltar (ChevronLeft) + GradientProgressBar
- Titulo: "Onde voce costumava organizar seu conteudo?"
- Subtitulo: "Selecione ate 3 opcoes."
- Usa `QuestionnaireMultiSelect` com as opcoes: Notion, Trello, Click-Up, Obsidian, Cadernos, Monday, Outros
- Limita selecao a 3 itens (valida no onChange)
- Botao "Continuar" aparece apos pelo menos 1 selecao (AnimatePresence)

### 2. `src/types/onboarding.ts`
- Adicionar campo `previous_tools?: string[]` na interface `OnboardingData`
- Atualizar `SCREENS_PER_PHASE` de `[10, 3, 3]` para `[10, 4, 3]`

### 3. `src/pages/NewOnboarding.tsx`
- Importar `Screen14PreviousTools`
- Adicionar bloco condicional para `phase === 1 && screen === 3` (mesmo padrao dos demais, com withDevBar e dev badge)
- Atualizar `canContinue()` para phase 1 screen 3: requer pelo menos 1 selecao em `previous_tools`

### 4. `src/hooks/useOnboarding.ts`
- Nenhuma mudanca necessaria (ja usa `SCREENS_PER_PHASE` dinamicamente)
