
## Plano: Implementar Tela 8 do Questionario (O que mais te trava?)

### Visao Geral

Esta tela estabelece o padrao de design para todas as futuras telas de questionario com multipla escolha. Baseada no wireframe fornecido, seguira a estrutura visual da Screen5ContentGoal, mas com logica de **multi-select**.

---

### 1. Criar Novo Componente QuestionnaireMultiSelect (Reutilizavel)

**Arquivo:** `src/components/onboarding/shared/QuestionnaireMultiSelect.tsx`

Um componente reutilizavel para todas as telas de questionario com multipla escolha:

```typescript
interface QuestionnaireMultiSelectProps {
  options: { id: string; label: string; emoji?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}
```

**Caracteristicas visuais (baseadas no wireframe):**

| Estado | Background | Texto | Extras |
|--------|-----------|-------|--------|
| Nao selecionada | `bg-violet-200/60` | Escuro | - |
| Selecionada | `bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300` | Branco | Emoji aleatorio do array |

**Emojis para itens selecionados:**
- Array pre-definido: `["💪", "🎯", "🔥", "✨", "💎", "🚀", "⚡", "🌟"]`
- Cada item selecionado recebe um emoji aleatorio (fixo por ID para consistencia)

---

### 2. Criar Screen6StickingPoints (Nova Tela 8)

**Arquivo:** `src/components/onboarding/screens/phase1/Screen6StickingPoints.tsx`

Esta tela substituira a atual `Screen4StickingPoints` da Phase 2 e sera parte da Phase 1 (nova Tela 8 do fluxo de 30 telas).

**Props:**
```typescript
interface Screen6StickingPointsProps {
  value: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}
```

**Layout (seguindo Screen5ContentGoal):**
```
+-----------------------------------------+
|  <-  [============================]     |  <- Header: back + progress bar
+-----------------------------------------+
|  Alem disso [First Name],               |  <- Subtitulo muted
|  O que mais te trava pra criar?         |  <- Titulo bold
|                                         |
|  +-----------------------------------+  |
|  |  Nao sei o que postar             |  |  <- Opcao nao selecionada
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  | :raising_hand: Nao consigo terminar o que   |  |  <- Opcao SELECIONADA
|  |     comeco                        |  |     (gradiente + emoji + texto branco)
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |  Tenho ideias mas nao executo     |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  | :question: Nao sei por onde comecar      |  |  <- Opcao SELECIONADA
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |  Me distraio facilmente           |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  | :gem_stone: Perfeccionismo me paralisa    |  |  <- Opcao SELECIONADA
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |         Continuar                 |  |  <- So aparece apos selecao
|  +-----------------------------------+  |
+-----------------------------------------+
```

**Comportamento:**
1. Todas opcoes comecam nao selecionadas (fundo lilas claro)
2. Clicar em uma opcao a seleciona (toggle)
3. Multiplas opcoes podem estar selecionadas
4. Opcoes selecionadas recebem gradiente + emoji aleatorio + texto branco
5. Botao "Continuar" aparece quando pelo menos 1 opcao esta selecionada
6. Clicar novamente em uma opcao selecionada a desseleciona

---

### 3. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 0 para 6 telas:

```typescript
// De: [5, 5, 5, 5, 2, 6]
// Para: [6, 5, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [6, 5, 5, 5, 2, 6];
```

---

### 4. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen6StickingPoints } from "@/components/onboarding/screens/phase1/Screen6StickingPoints";
```

**Adicionar renderizacao para Phase 0, Screen 5:**
```typescript
if (state.phase === 0 && state.screen === 5) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen6StickingPoints
        value={state.data.sticking_points || []}
        onChange={(value) => updateData({ sticking_points: value })}
        onContinue={handleContinue}
        onBack={handleBack}
        progress={getProgress()}
        username={state.data.username || ""}
      />
    </>
  );
}
```

**Atualizar canContinue():**
```typescript
if (phase === 0) {
  // ... existing screens 0-4 ...
  if (screen === 5) return (data.sticking_points?.length ?? 0) > 0; // Nova validacao
}
```

---

### 5. Diagrama do Fluxo Atualizado (Phase 0)

```
Screen 0: Welcome
    |
    v
Screen 1: HowWeHelpSection (3 steps internos)
    |
    v
Screen 2: StartQuestionnaire (transicao)
    |
    v
Screen 3: Username (input) <-- Padrao para telas de input
    |
    v
Screen 4: ContentGoal (single-select com toggle)
    |
    v
Screen 5: StickingPoints (multi-select) <-- NOVA TELA 8
    |
    v
Phase 1, Screen 0: ...
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/shared/QuestionnaireMultiSelect.tsx` | **CRIAR** - Componente reutilizavel |
| `src/components/onboarding/screens/phase1/Screen6StickingPoints.tsx` | **CRIAR** - Tela 8 do onboarding |
| `src/types/onboarding.ts` | MODIFICAR - Atualizar SCREENS_PER_PHASE |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar renderizacao e validacao |

---

### Secao Tecnica

**Geracao de emoji consistente por ID:**
```typescript
const getEmojiForId = (id: string): string => {
  const emojis = ["💪", "🎯", "🔥", "✨", "💎", "🚀", "⚡", "🌟"];
  // Gera um indice baseado no hash do ID para consistencia
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
};
```

**Animacoes Framer Motion:**
- Transicao suave entre estados selecionado/nao-selecionado
- Fade-in do emoji quando selecionado
- Fade-in do botao Continuar

**Reutilizacao futura:**
Este componente `QuestionnaireMultiSelect` sera usado em todas as futuras telas de multi-select do questionario (ex: Screen7PreviousAttempts, etc).
