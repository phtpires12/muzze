
## Plano: Implementar Tela 13 "A Ciencia" do Onboarding

### Visao Geral

Esta tela apresenta a fundamentacao cientifica por tras da Muzze, usando a ilustracao do cerebro como elemento visual hero. O layout segue o padrao do mockup do celular - a imagem do cerebro e inserida como asset e o app serve como container.

---

### 1. Copiar Imagem do Cerebro para Assets

**Arquivo:** `src/assets/onboarding/brain-science.png`

Copiar a imagem do cerebro fornecida (`user-uploads://Cópia_de_Mockups_aleatórios_1.png`) para a pasta de assets do onboarding.

---

### 2. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 1 para 6 telas (adicionando a nova tela):

```typescript
// De: [10, 5, 5, 5, 2, 6]
// Para: [10, 6, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [10, 6, 5, 5, 2, 6];
```

---

### 3. Criar Componente Screen11BehavioralScience

**Arquivo:** `src/components/onboarding/screens/phase1/Screen11BehavioralScience.tsx`

**Props:**
```typescript
interface Screen11BehavioralScienceProps {
  onContinue: () => void;
  onBack: () => void;
}
```

**Layout Visual (baseado no wireframe):**

```text
+-----------------------------------------+
|  <-                                     |  <- Back button
+-----------------------------------------+
|                                         |
|   Aqui voce Cria Conteudo               |  <- Titulo em gradiente
|   com base na Ciencia                   |     roxo (italic)
|   Comportamental.                       |
|                                         |
|         [BRAIN IMAGE]                   |  <- Ilustracao do cerebro
|      (com labels coloridos)             |     como imagem asset
|                                         |
+-----------------------------------------+
|                                         |
|  +-----------------------------------+  |  <- Card 1
|  | Metodo Pomodoro                   |  |
|  | Ciclos de 5-25 minutos sao ideais |  |
|  | para entrar em estado de foco...  |  |
|  | (Mais de 2 milhoes de pessoas...) |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |  <- Card 2
|  | Habitos Atomicos (James Clear)    |  |
|  | Micro-compromissos diarios, sao   |  |
|  | a melhor forma de criar habitos   |  |
|  | consistentes.                     |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |  <- Card 3
|  | O Ato Criativo (Rick Rubin)       |  |
|  | Criatividade surge quando ha      |  |
|  | silencio, atencao e presenca...   |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |           Continuar               |  |  <- Botao gradiente
|  +-----------------------------------+  |
+-----------------------------------------+
```

---

### 4. Conteudo dos Cards

**Card 1 - Metodo Pomodoro:**
- Titulo: "Metodo Pomodoro"
- Texto: "Ciclos de 5-25 minutos sao ideais para vencer a resistencia inicial e entrar em estado de foco profundo."
- Credibilidade: "Mais de 2 milhoes de pessoas usam essa tecnica diariamente."

**Card 2 - Habitos Atomicos:**
- Titulo: "Habitos Atomicos (James Clear)"
- Texto: "Micro-compromissos diarios, sao a melhor forma de criar habitos consistentes."

**Card 3 - O Ato Criativo:**
- Titulo: "O Ato Criativo (Rick Rubin)"
- Texto: "Criatividade surge quando ha silencio, atencao e presenca — nao pressao."
- Credibilidade: "Rick Rubin e um dos produtores criativos mais influentes da historia."

---

### 5. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen11BehavioralScience } from "@/components/onboarding/screens/phase1/Screen11BehavioralScience";
```

**Atualizar renderScreen() para Phase 1:**

A nova tela sera a Screen 0 do Phase 1. Todas as telas existentes do Phase 1 serao movidas uma posicao para frente:

```typescript
// Phase 1: Pain Diagnosis (agora com 6 telas)
if (phase === 1) {
  if (screen === 0) {
    // NOVA: Screen11BehavioralScience
    return null; // Renderiza fora do OnboardingLayout
  }
  if (screen === 1) {
    // Antigo screen 0: StickingPoints
    return <Screen4StickingPoints ... />;
  }
  // ... demais telas movidas +1
}
```

**Adicionar renderizacao para Phase 1, Screen 0:**

```typescript
// BehavioralScience renderiza fora do OnboardingLayout - tela educacional com imagem hero
if (state.phase === 1 && state.screen === 0) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen11BehavioralScience
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </>
  );
}
```

**Atualizar canContinue():**

```typescript
if (phase === 1) {
  if (screen === 0) return true; // BehavioralScience - transition screen
  if (screen === 1) return (data.sticking_points?.length ?? 0) > 0; // StickingPoints (antigo 0)
  // ... demais validacoes movidas +1
}
```

---

### 6. Diagrama do Fluxo Atualizado

```text
Phase 0 (10 telas):
  Screen 0-9: Welcome -> ... -> ClusterFeedback
       |
       v
Phase 1 (6 telas - antes eram 5):
  Screen 0: BehavioralScience (Tela 13 - NOVA)
       |
       v
  Screen 1: StickingPoints (antigo Screen 0)
  Screen 2: MonthsTrying (antigo Screen 1)
  Screen 3: CurrentPosts (antigo Screen 2)
  Screen 4: PreviousAttempts (antigo Screen 3)
  Screen 5: ImpactScale (antigo Screen 4)
```

---

### 7. Especificacoes de Design

**Titulo:**
- Fonte italica
- Gradiente roxo (similar ao branding Muzze)
- Centralizado

**Imagem do Cerebro:**
- Carregada como asset (`import brainScience from "@/assets/onboarding/brain-science.png"`)
- Centralizada
- Tamanho responsivo (max-w-sm ou similar)
- Mantem os labels coloridos que ja fazem parte da imagem

**Cards:**
- Background branco/lavanda claro
- Rounded corners
- Titulo em bold
- Texto descritivo menor
- Texto de credibilidade em italico/menor ainda

**Botao:**
- Estilo gradiente (como outras telas)
- Full width
- Rounded full (pill)

---

### 8. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/assets/onboarding/brain-science.png` | **CRIAR** (copiar da imagem enviada) |
| `src/components/onboarding/screens/phase1/Screen11BehavioralScience.tsx` | **CRIAR** |
| `src/types/onboarding.ts` | MODIFICAR - Atualizar SCREENS_PER_PHASE para [10, 6, 5, 5, 2, 6] |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar import, reordenar telas Phase 1, adicionar renderizacao |

---

### Secao Tecnica

**Estrutura do componente:**

```typescript
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import brainScience from "@/assets/onboarding/brain-science.png";

interface Screen11BehavioralScienceProps {
  onContinue: () => void;
  onBack: () => void;
}

const SCIENCE_METHODS = [
  {
    title: "Metodo Pomodoro",
    description: "Ciclos de 5-25 minutos sao ideais para vencer a resistencia inicial e entrar em estado de foco profundo.",
    credibility: "Mais de 2 milhoes de pessoas usam essa tecnica diariamente.",
  },
  {
    title: "Habitos Atomicos (James Clear)",
    description: "Micro-compromissos diarios, sao a melhor forma de criar habitos consistentes.",
  },
  {
    title: "O Ato Criativo (Rick Rubin)",
    description: "Criatividade surge quando ha silencio, atencao e presenca — nao pressao.",
    credibility: "Rick Rubin e um dos produtores criativos mais influentes da historia.",
  },
];

export const Screen11BehavioralScience = ({
  onContinue,
  onBack,
}: Screen11BehavioralScienceProps) => {
  return (
    <div className="min-h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col overflow-y-auto">
      {/* Header with back button */}
      <div className="px-4 pt-12 sm:pt-16">
        <button onClick={onBack} className="...">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-6 pb-8">
        {/* Title with gradient */}
        <motion.h1 
          className="text-2xl font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mb-6"
        >
          Aqui voce Cria Conteudo com base na Ciencia Comportamental.
        </motion.h1>

        {/* Brain illustration */}
        <motion.div className="flex justify-center mb-8">
          <img 
            src={brainScience} 
            alt="Cerebro com sistemas comportamentais" 
            className="w-full max-w-xs"
          />
        </motion.div>

        {/* Science method cards */}
        <div className="space-y-4 mb-6">
          {SCIENCE_METHODS.map((method, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold mb-1">{method.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {method.description}
              </p>
              {method.credibility && (
                <p className="text-xs text-muted-foreground/70 italic">
                  {method.credibility}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Continue button */}
        <Button
          onClick={onContinue}
          className="w-full rounded-full"
          variant="gradient-pill"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
```

**Importante sobre a imagem:**
- A imagem do cerebro ja contem os labels coloridos ("Controlador de Motivacao", "Sistema direcionado a Objetivos", "Sistema de Habitos")
- Nao preciso recriar esses labels em codigo - eles fazem parte da imagem
- A imagem funciona como um asset estatico, similar ao mockup do celular
