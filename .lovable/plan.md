

## Plano: Implementar Tela 14 - Tempo Diario de Criacao

### Objetivo

Criar uma nova tela de questionario (single-select) perguntando ao usuario quanto tempo por dia ele pode dedicar a criacao de conteudo. Esta tela segue o padrao visual ja estabelecido nas telas 9 (Constancia) e outras telas de questionario.

---

### Posicionamento no Fluxo

| Aspecto | Valor |
|---------|-------|
| **Fase** | 1 (Pain Diagnosis) |
| **Screen Index** | 1 (apos BehavioralScience que e Screen 0) |
| **Componente** | `Screen12DailyTime.tsx` |
| **Campo de dados** | `daily_available_time: string` |

**Observacao:** A Tela 14 sera inserida na Phase 1, deslocando as telas existentes. O SCREENS_PER_PHASE de Phase 1 passara de `[6]` para `[7]`.

---

### Copy da Tela

```text
Titulo personalizado: "[First Name] no dia a dia, por quanto tempo voce pode criar?"

Opcoes (single-select com emoji):
- ⏱️ 15-30 minutos
- ⏱️ 30-60 minutos
- ⏱️ Mais de 1 hora  
- ⏱️ Sou Creator Full-Time
```

---

### Estrutura Visual

```text
+------------------------------------------+
|  <- (back)  [====== Progress Bar ======] |
+------------------------------------------+
|                                          |
|  [First Name] no dia a dia,              |
|  por quanto tempo voce pode criar?       |  <- Titulo (bold)
|                                          |
+------------------------------------------+
|  +------------------------------------+  |
|  | ⏱️  15-30 minutos                  |  |  <- Opcao 1
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | ⏱️  30-60 minutos                  |  |  <- Opcao 2
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | ⏱️  Mais de 1 hora                 |  |  <- Opcao 3
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | ⏱️  Sou Creator Full-Time          |  |  <- Opcao 4
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
|  +------------------------------------+  |
|  |           Continuar                |  |  <- Aparece apos selecao
|  +------------------------------------+  |
+------------------------------------------+
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen12DailyTime.tsx` | **CRIAR** - Novo componente de questionario |
| `src/types/onboarding.ts` | **MODIFICAR** - Adicionar campo `daily_available_time` e constante `DAILY_TIME_OPTIONS` |
| `src/pages/NewOnboarding.tsx` | **MODIFICAR** - Integrar nova tela na Phase 1 |

**SCREENS_PER_PHASE**: Atualizar de `[10, 6, 5, 5, 2, 6]` para `[10, 7, 5, 5, 2, 6]`

---

### Definicao de Dados

```typescript
// Adicionar em OnboardingData (src/types/onboarding.ts)
daily_available_time?: string;

// Nova constante
export const DAILY_TIME_OPTIONS = [
  { id: "15_30_min", label: "15-30 minutos", emoji: "⏱️" },
  { id: "30_60_min", label: "30-60 minutos", emoji: "⏱️" },
  { id: "more_than_1h", label: "Mais de 1 hora", emoji: "⏱️" },
  { id: "full_time", label: "Sou Creator Full-Time", emoji: "⏱️" },
] as const;
```

---

### Componente Screen12DailyTime.tsx

```tsx
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { DAILY_TIME_OPTIONS } from "@/types/onboarding";
import { motion, AnimatePresence } from "framer-motion";

interface Screen12DailyTimeProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen12DailyTime = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen12DailyTimeProps) => {
  const firstName = username?.split(" ")[0] || "";

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      {/* Header: Back + Progress */}
      <div className="px-4 pt-12 sm:pt-16 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-violet-100 dark:hover:bg-muted transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-foreground mb-6 leading-tight">
            {firstName ? `${firstName} no dia a dia,` : "No dia a dia,"}<br />
            por quanto tempo voce pode criar?
          </h1>
        </motion.div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {DAILY_TIME_OPTIONS.map((option, index) => {
            const isSelected = value === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onChange(option.id)}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300"
                    : "bg-violet-200/60 hover:bg-violet-200/80"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.emoji}</span>
                  <p
                    className={`font-medium text-base ${
                      isSelected ? "text-white" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </p>
                </div>
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
            transition={{ duration: 0.3 }}
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

---

### Integracao em NewOnboarding.tsx

**1. Adicionar import:**
```tsx
import { Screen12DailyTime } from "@/components/onboarding/screens/phase1/Screen12DailyTime";
```

**2. Adicionar handler apos BehavioralScience (Phase 1, Screen 1):**
```tsx
if (state.phase === 1 && state.screen === 1) {
  return (
    <>
      {/* Developer Badge */}
      {(isDeveloper || isAdmin) && (
        <div className="fixed top-4 right-4 z-50 ...">...</div>
      )}
      <Screen12DailyTime
        value={state.data.daily_available_time || ""}
        onChange={(value) => updateData({ daily_available_time: value })}
        onContinue={handleContinue}
        onBack={handleBack}
        progress={getProgress()}
        username={state.data.username || ""}
      />
    </>
  );
}
```

**3. Atualizar renderScreen() para Phase 1:**
- Screen 0: BehavioralScience (ja existe, renderiza fora)
- Screen 1: DailyTime (nova, renderiza fora)
- Screen 2-6: Telas existentes deslocadas (renumerar indices +1)

**4. Atualizar canContinue() para Phase 1:**
```tsx
if (phase === 1) {
  if (screen === 0) return true; // BehavioralScience
  if (screen === 1) return !!data.daily_available_time; // DailyTime
  if (screen === 2) return (data.sticking_points?.length ?? 0) > 0;
  // ... restante deslocado +1
}
```

---

### Atualizacao de SCREENS_PER_PHASE

```typescript
// src/types/onboarding.ts
export const SCREENS_PER_PHASE = [10, 7, 5, 5, 2, 6];
//                                    ^ era 6, agora 7
```

---

### Secao Tecnica

**Padrao Visual:**
- Background: `bg-violet-50 dark:bg-background`
- Header: Back button + GradientProgressBar
- Opcoes: `bg-violet-200/60` (default), gradient rosa-laranja-amarelo (selecionado)
- Animacoes: framer-motion com fade-in e stagger
- Botao Continuar: `variant="gradient-pill"`, aparece apos selecao

**Fluxo de Dados:**
- Campo `daily_available_time` armazenado em `OnboardingData`
- Sera usado na personalizacao do plano (Tela 20) junto com `consistency_cluster`

**Por que emoji ⏱️ em todas as opcoes?**
- Mantem consistencia visual
- O emoji de relogio reforça que a pergunta e sobre tempo
- Padrao diferente do multi-select que usa emojis dinamicos

