

## Plano: Implementar Tela 15 - Horario para Criar

### Objetivo

Criar uma nova tela de input de horario (time picker) na Phase 1, onde o usuario seleciona seu melhor horario para criacao de conteudo. Esta tela usa um campo de input type="time" ao inves de opcoes pre-definidas.

---

### Posicionamento no Fluxo

| Aspecto | Valor |
|---------|-------|
| **Fase** | 1 (Pain Diagnosis) |
| **Screen Index** | 2 (apos DailyTime que e Screen 1) |
| **Componente** | `Screen13CreationTime.tsx` |
| **Campo de dados** | `preferred_creation_time: string` |

**Observacao:** A Tela 15 sera inserida na Phase 1, deslocando as telas existentes (StickingPoints, MonthsTrying, etc). O SCREENS_PER_PHASE de Phase 1 passara de `[7]` para `[8]`.

---

### Copy da Tela

```text
Titulo: "[First Name], qual melhor horario pra voce criar?"

Subtitulo: "Escolha o momento do dia em que voce tem mais energia criativa."

Dica (card inferior): 
"💡 Dica:
Escolha um horario em que voce geralmente esta livre e com energia. 
Manha cedo funciona bem para muitos criadores, mas o importante e 
ser consistente com o horario escolhido."
```

---

### Estrutura Visual

```text
+------------------------------------------+
|  <- (back)  [====== Progress Bar ======] |
+------------------------------------------+
|                                          |
|  [First Name], qual melhor horario       |
|  pra voce criar?                         |  <- Titulo (bold)
|                                          |
|  Escolha o momento do dia em que voce    |  <- Subtitulo
|  tem mais energia criativa.              |
|                                          |
+------------------------------------------+
|                                          |
|          +------------------+            |
|          |    [ 09:00 ]     |            |  <- Input time
|          +------------------+            |
|                                          |
+------------------------------------------+
|  +------------------------------------+  |
|  | 💡 Dica:                           |  |
|  | Escolha um horario em que voce     |  |  <- Card dica
|  | geralmente esta livre e com        |  |
|  | energia...                         |  |
|  +------------------------------------+  |
+------------------------------------------+
|  +------------------------------------+  |
|  |           Continuar                |  |  <- Sempre visivel
|  +------------------------------------+  |     (horario tem default)
+------------------------------------------+
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen13CreationTime.tsx` | **CRIAR** - Novo componente com time input |
| `src/types/onboarding.ts` | **MODIFICAR** - Adicionar campo `preferred_creation_time` e atualizar SCREENS_PER_PHASE |
| `src/pages/NewOnboarding.tsx` | **MODIFICAR** - Integrar nova tela na Phase 1, Screen 2 e deslocar indices |

**SCREENS_PER_PHASE**: Atualizar de `[10, 7, 5, 5, 2, 6]` para `[10, 8, 5, 5, 2, 6]`

---

### Definicao de Dados

```typescript
// Adicionar em OnboardingData (src/types/onboarding.ts)
preferred_creation_time?: string; // Formato "HH:MM"
```

---

### Componente Screen13CreationTime.tsx

```tsx
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { motion } from "framer-motion";

interface Screen13CreationTimeProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen13CreationTime = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen13CreationTimeProps) => {
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
          className="space-y-2 mb-8"
        >
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {firstName ? `${firstName}, qual melhor` : "Qual melhor"}<br />
            horario pra voce criar?
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha o momento do dia em que voce tem mais energia criativa.
          </p>
        </motion.div>

        {/* Time Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <Input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-2xl h-16 w-40 text-center font-medium 
              bg-white dark:bg-secondary/50 border-2 border-violet-200 
              dark:border-violet-800 rounded-2xl focus:border-primary 
              focus:ring-primary"
          />
        </motion.div>

        {/* Tip Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Card className="p-4 bg-violet-100/50 dark:bg-violet-900/20 border-0">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">💡 Dica:</p>
              <p className="text-muted-foreground leading-relaxed">
                Escolha um horario em que voce geralmente esta livre e com energia. 
                Manha cedo funciona bem para muitos criadores, mas o importante e 
                ser consistente com o horario escolhido.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Continue Button - always visible since time has default value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
    </div>
  );
};
```

---

### Integracao em NewOnboarding.tsx

**1. Adicionar import:**
```tsx
import { Screen13CreationTime } from "@/components/onboarding/screens/phase1/Screen13CreationTime";
```

**2. Adicionar bloco de renderizacao apos DailyTime (Phase 1, Screen 2):**
```tsx
// CreationTime renderiza fora do OnboardingLayout - tem layout proprio com time input
if (state.phase === 1 && state.screen === 2) {
  return (
    <>
      {/* Developer Badge */}
      {(isDeveloper || isAdmin) && (
        <div className="fixed top-4 right-4 z-50 ...">...</div>
      )}
      <Screen13CreationTime
        value={state.data.preferred_creation_time || "09:00"}
        onChange={(value) => updateData({ preferred_creation_time: value })}
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
- Screen 0: BehavioralScience (ja existe)
- Screen 1: DailyTime (ja existe)
- Screen 2: CreationTime (NOVA)
- Screen 3-7: Telas existentes deslocadas (renumerar indices +1)

**4. Atualizar canContinue() para Phase 1:**
```tsx
if (phase === 1) {
  if (screen === 0) return true; // BehavioralScience
  if (screen === 1) return !!data.daily_available_time; // DailyTime
  if (screen === 2) return true; // CreationTime - sempre pode continuar (tem default)
  if (screen === 3) return (data.sticking_points?.length ?? 0) > 0; // era screen 2
  if (screen === 4) return (data.months_trying ?? 0) > 0; // era screen 3
  if (screen === 5) return (data.current_post_count ?? 0) >= 0; // era screen 4
  if (screen === 6) return (data.previous_attempts?.length ?? 0) > 0; // era screen 5
  if (screen === 7) { // era screen 6
    return (
      data.inconsistency_impact?.financial > 0 &&
      data.inconsistency_impact?.emotional > 0 &&
      data.inconsistency_impact?.professional > 0
    );
  }
}
```

---

### Atualizacao de SCREENS_PER_PHASE

```typescript
// src/types/onboarding.ts
export const SCREENS_PER_PHASE = [10, 8, 5, 5, 2, 6];
//                                    ^ era 7, agora 8
```

---

### Atualizacao de OnboardingData

```typescript
// Adicionar novo campo em OnboardingData
export interface OnboardingData {
  // Phase 1: Hook + Dream Outcome
  username?: string;
  content_goal?: string;
  preferred_platform?: string;
  daily_available_time?: string;
  preferred_creation_time?: string;  // NOVO - Formato "HH:MM"
  
  // ... resto permanece igual
}
```

---

### Secao Tecnica

**Padrao Visual:**
- Background: `bg-violet-50 dark:bg-background`
- Header: Back button + GradientProgressBar
- Input time: Centralizado, fonte grande (text-2xl), borda roxa suave
- Card de dica: `bg-violet-100/50` com emoji e texto explicativo
- Botao Continuar: `variant="gradient-pill"`, sempre visivel (valor default "09:00")

**Fluxo de Dados:**
- Campo `preferred_creation_time` armazenado em `OnboardingData`
- Valor default: "09:00" (manha)
- Sera usado para configurar lembretes e personalizacao do plano

**Diferencas do Screen20CreationTime (Phase 5):**
- Screen13 usa o layout padronizado das telas de questionario (violet-50, progress bar, etc)
- Screen20 usa o layout antigo com Cards e design diferente
- Ambos salvam em campos diferentes para permitir revisao posterior

**Por que o botao Continuar esta sempre visivel?**
- O input type="time" tem um valor default ("09:00")
- Nao faz sentido esconder o botao quando sempre ha um valor valido

