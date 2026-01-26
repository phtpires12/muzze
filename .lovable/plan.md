

## Plano: Implementar Tela 11 do Onboarding (Constancia + Sistema de Clusters)

### Visao Geral

Esta tela introduz o **sistema de clusters comportamentais** que sera usado na Tela 20 para personalizar o plano do usuario. A tela segue o padrao visual de single-select (como Screen5ContentGoal) e adiciona logica de direcionamento para 3 versoes diferentes da Tela 12.

---

### 1. Atualizar OnboardingData com Campos de Cluster

**Arquivo:** `src/types/onboarding.ts`

Adicionar novos campos para suportar o sistema de clusters:

```typescript
export interface OnboardingData {
  // ... campos existentes ...
  
  // Sistema de Clusters (novo)
  posting_frequency?: string;           // ID da frequencia selecionada
  consistency_cluster?: 1 | 2 | 3;      // Cluster derivado (1=Sem, 2=Em Construcao, 3=Alta)
  screen12_variant?: 'hurt' | 'path' | 'machine';  // Variante da Tela 12
}
```

**Adicionar constante com opcoes:**

```typescript
export const POSTING_FREQUENCY_OPTIONS = [
  {
    id: "super_consistent",
    label: "Sou super constante (pelo menos 3x na semana)",
    cluster: 3 as const,
    screen12Variant: "machine" as const,
  },
  {
    id: "almost_consistent", 
    label: "Quase constante (1x na semana)",
    cluster: 2 as const,
    screen12Variant: "path" as const,
  },
  {
    id: "no_consistency",
    label: "Nao tenho constancia (1x a 2x por mes)",
    cluster: 1 as const,
    screen12Variant: "hurt" as const,
  },
  {
    id: "when_possible",
    label: "Posto quando da",
    cluster: 1 as const,
    screen12Variant: "hurt" as const,
  },
] as const;
```

---

### 2. Criar Componente Screen9Constancia

**Arquivo:** `src/components/onboarding/screens/phase1/Screen9Constancia.tsx`

**Props:**
```typescript
interface Screen9ConstanciaProps {
  value: string;
  onChange: (value: string, cluster: 1 | 2 | 3, variant: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}
```

**Layout Visual (seguindo Screen5ContentGoal):**

```text
+-----------------------------------------+
|  <-  [============================]     |  <- Header: back + progress bar
+-----------------------------------------+
|                                         |
|  Entendi, [First Name]                  |  <- Subtitle muted
|  e de la pra ca...                      |
|                                         |
|  Quantos posts por semana               |  <- Titulo bold
|  voce tem feito?                        |
|                                         |
|  +-----------------------------------+  |
|  |  Sou super constante              |  |  <- Opcao (cluster 3)
|  |  (pelo menos 3x na semana)        |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |  Quase constante                  |  |  <- Opcao (cluster 2)
|  |  (1x na semana)                   |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |  Nao tenho constancia             |  |  <- Opcao (cluster 1)
|  |  (1x a 2x por mes)                |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |  Posto quando da                  |  |  <- Opcao (cluster 1)
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  |           Continuar               |  |  <- Aparece apos selecao
|  +-----------------------------------+  |
+-----------------------------------------+
```

**Comportamento:**
1. Single-select (apenas uma opcao pode estar selecionada)
2. Ao selecionar, aplica gradiente + texto branco
3. onChange passa: `(id, cluster, screen12Variant)`
4. Botao "Continuar" aparece apos selecao
5. Armazena `posting_frequency`, `consistency_cluster` e `screen12_variant`

---

### 3. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 0 para 9 telas:

```typescript
// De: [8, 5, 5, 5, 2, 6]
// Para: [9, 5, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [9, 5, 5, 5, 2, 6];
```

---

### 4. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen9Constancia } from "@/components/onboarding/screens/phase1/Screen9Constancia";
```

**Adicionar handler especial para onChange:**
```typescript
const handleConstanciaChange = (
  value: string, 
  cluster: 1 | 2 | 3, 
  variant: 'hurt' | 'path' | 'machine'
) => {
  updateData({ 
    posting_frequency: value,
    consistency_cluster: cluster,
    screen12_variant: variant,
  });
};
```

**Adicionar renderizacao para Phase 0, Screen 8:**

Apos o bloco de Screen 7 (MonthsTrying):

```typescript
if (state.phase === 0 && state.screen === 8) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen9Constancia
        value={state.data.posting_frequency || ""}
        onChange={handleConstanciaChange}
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
  // ... existing screens 0-7 ...
  if (screen === 8) return !!data.posting_frequency; // Constancia
}
```

**Atualizar renderScreen():**

```typescript
if (screen === 8) return null; // Constancia renderiza fora do OnboardingLayout
```

---

### 5. Sistema de Clusters - Logica de Personalizacao

O sistema de clusters funcionara assim:

| Selecao | Cluster | Variante Tela 12 | Objetivo do Cluster |
|---------|---------|------------------|---------------------|
| Super constante (3x+) | 3 | "machine" (Voce e uma maquina!) | Otimizar processo, evitar desgaste |
| Quase constante (1x) | 2 | "path" (Caminho) | Organizar processo, aumentar frequencia |
| Sem constancia (1-2x/mes) | 1 | "hurt" (Doeu ver isso?) | Reduzir pressao, comecar pequeno |
| Posto quando da | 1 | "hurt" (Doeu ver isso?) | Reduzir pressao, comecar pequeno |

**Na Tela 20, combinar com:**
- `content_goal` (Desejo principal)
- `sticking_points[0]` (Trava principal)
- `daily_goal_minutes` (Tempo diario disponivel)
- `creation_time` (Horario escolhido)

---

### 6. Diagrama do Fluxo Atualizado (Phase 0)

```text
Screen 0: Welcome
    |
    v
Screen 1: HowWeHelpSection
    |
    v
Screen 2: StartQuestionnaire
    |
    v
Screen 3: Username
    |
    v
Screen 4: ContentGoal
    |
    v
Screen 5: StickingPoints
    |
    v
Screen 6: Diferencial
    |
    v
Screen 7: MonthsTrying
    |
    v
Screen 8: Constancia (Tela 11)  <-- NOVA TELA
    |
    +---> cluster 1 (hurt) ------> Tela 12: "Doeu ver isso?"
    |
    +---> cluster 2 (path) ------> Tela 12: "Caminho"
    |
    +---> cluster 3 (machine) ---> Tela 12: "Voce e uma maquina!"
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen9Constancia.tsx` | **CRIAR** |
| `src/types/onboarding.ts` | MODIFICAR - Adicionar campos de cluster + POSTING_FREQUENCY_OPTIONS + atualizar SCREENS_PER_PHASE |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar import, handler, renderizacao e validacao |

---

### Secao Tecnica

**Estrutura do componente (baseada em Screen5ContentGoal):**

```typescript
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { POSTING_FREQUENCY_OPTIONS } from "@/types/onboarding";
import { motion, AnimatePresence } from "framer-motion";

interface Screen9ConstanciaProps {
  value: string;
  onChange: (value: string, cluster: 1 | 2 | 3, variant: 'hurt' | 'path' | 'machine') => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen9Constancia = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen9ConstanciaProps) => {
  const firstName = username?.split(" ")[0] || "";

  const handleOptionClick = (option: typeof POSTING_FREQUENCY_OPTIONS[number]) => {
    onChange(option.id, option.cluster, option.screen12Variant);
  };

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 sm:pt-16 flex items-center gap-3">
        <button onClick={onBack} ...>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        <p className="text-muted-foreground text-sm mb-1">
          {firstName ? `Entendi, ${firstName}` : "Entendi"}
          <br />e de la pra ca...
        </p>
        <h1 className="text-xl font-bold mb-6">
          Quantos posts por semana voce tem feito?
        </h1>

        {/* Options */}
        <div className="space-y-3">
          {POSTING_FREQUENCY_OPTIONS.map((option) => {
            const isSelected = value === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300"
                    : "bg-violet-200/60 hover:bg-violet-200/80"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <p className={`font-medium ${isSelected ? "text-white" : "text-foreground"}`}>
                  {option.label}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 pb-8 pt-4"
          >
            <Button
              onClick={onContinue}
              variant="gradient-pill"
              size="lg"
              className="w-full"
            >
              Continuar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

**Tipagem do cluster derivado:**

```typescript
// Em onboarding.ts
export type ConsistencyCluster = 1 | 2 | 3;
export type Screen12Variant = 'hurt' | 'path' | 'machine';
```

**Uso futuro na Tela 20:**

```typescript
// Exemplo de como os dados serao combinados na Tela 20
const generatePersonalizedPlan = (data: OnboardingData) => {
  const cluster = data.consistency_cluster;
  const goal = data.content_goal;
  const mainBlock = data.sticking_points?.[0];
  const dailyMinutes = data.daily_goal_minutes;
  const creationTime = data.creation_time;

  // Logica de personalizacao baseada no cluster
  switch (cluster) {
    case 1: // Sem Constancia
      return { tone: "gentle", commitment: "small", focus: "habit_building" };
    case 2: // Em Construcao
      return { tone: "encouraging", commitment: "moderate", focus: "organization" };
    case 3: // Alta Constancia
      return { tone: "optimizing", commitment: "high", focus: "efficiency" };
  }
};
```

