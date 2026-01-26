

## Plano: Implementar Tela 10 do Onboarding (Meses Tentando)

### Visao Geral

Esta tela é do tipo "questionário com input", seguindo exatamente o mesmo padrão visual da tela de nome (Screen2Username). O usuário informa há quantos meses tenta ser consistente na criação de conteúdo.

---

### 1. Criar Componente Screen8MonthsTrying

**Arquivo:** `src/components/onboarding/screens/phase1/Screen8MonthsTrying.tsx`

**Props (seguindo padrão de Screen2Username):**
```typescript
interface Screen8MonthsTryingProps {
  value: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}
```

**Layout Visual (idêntico à tela de nome):**

```text
+-----------------------------------------+
|  <-  [============================]     |  <- Header: back + progress bar
+-----------------------------------------+
|                                         |
|  Há quanto tempo você tá                |  <- Título bold
|  tentando criar?                        |
|                                         |
|                                         |
|                                         |
|                                         |
+-----------------------------------------+
|                                         |
|  +-----------------------------------+  |
|  |      Número de meses              |  |  <- Input centralizado
|  +-----------------------------------+  |
|                                         |
|  Isso nos ajuda a entender o tamanho    |  <- Texto auxiliar muted
|  do seu desafio.                        |
|                                         |
|  +-----------------------------------+  |
|  |           Continuar               |  |  <- Botão pill (habilitado quando > 0)
|  +-----------------------------------+  |
+-----------------------------------------+
```

**Elementos:**
- Header com botão voltar + GradientProgressBar
- Título na área superior
- Input numérico centralizado no bottom
- Texto auxiliar (muted-foreground)
- Botão "Continuar" habilitado quando valor > 0

---

### 2. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 0 para 8 telas:

```typescript
// De: [7, 5, 5, 5, 2, 6]
// Para: [8, 5, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [8, 5, 5, 5, 2, 6];
```

---

### 3. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen8MonthsTrying } from "@/components/onboarding/screens/phase1/Screen8MonthsTrying";
```

**Adicionar renderização para Phase 0, Screen 7:**

Após o bloco de Screen 6 (Diferencial), adicionar:

```typescript
if (state.phase === 0 && state.screen === 7) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen8MonthsTrying
        value={state.data.months_trying || 0}
        onChange={(value) => updateData({ months_trying: value })}
        onContinue={handleContinue}
        onBack={handleBack}
        progress={getProgress()}
      />
    </>
  );
}
```

**Atualizar canContinue():**

```typescript
if (phase === 0) {
  // ... existing screens 0-6 ...
  if (screen === 7) return (data.months_trying ?? 0) > 0; // MonthsTrying
}
```

**Atualizar renderScreen():**

Adicionar `if (screen === 7) return null;` para que a tela renderize fora do OnboardingLayout.

---

### 4. Diagrama do Fluxo Atualizado (Phase 0)

```text
Screen 0: Welcome
    |
    v
Screen 1: HowWeHelpSection (3 steps internos)
    |
    v
Screen 2: StartQuestionnaire (transição)
    |
    v
Screen 3: Username (input) <-- Padrão para telas de input
    |
    v
Screen 4: ContentGoal (single-select com toggle)
    |
    v
Screen 5: StickingPoints (multi-select)
    |
    v
Screen 6: Diferencial + Rating
    |
    v
Screen 7: MonthsTrying (input numérico) <-- NOVA TELA 10
    |
    v
Phase 1, Screen 0: ...
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen8MonthsTrying.tsx` | **CRIAR** |
| `src/types/onboarding.ts` | MODIFICAR - Atualizar SCREENS_PER_PHASE |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar renderização e validação |

---

### Seção Técnica

**Estrutura do componente (baseada em Screen2Username):**

```typescript
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";

export const Screen8MonthsTrying = ({ 
  value, 
  onChange, 
  onContinue, 
  onBack, 
  progress 
}: Screen8MonthsTryingProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value > 0) {
      onContinue();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-secondary/30 dark:bg-background flex flex-col">
      {/* Header: Back + Progress */}
      <div className="px-4 pt-4 sm:pt-6 flex items-center gap-3">
        <button onClick={onBack} ...>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-12 sm:pt-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Há quanto tempo você tá<br/>tentando criar?
        </h1>
      </div>

      {/* Input + Helper + Button (bottom) */}
      <div className="px-6 pb-8 space-y-4">
        <Input
          type="number"
          min="0"
          max="120"
          placeholder="Número de meses"
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          className="bg-secondary/50 border-secondary h-14 rounded-xl text-lg text-center"
          autoFocus
        />
        <p className="text-sm text-muted-foreground text-center">
          Isso nos ajuda a entender o tamanho do seu desafio.
        </p>
        <Button
          onClick={onContinue}
          disabled={value <= 0}
          className="w-full h-14 rounded-full bg-primary ..."
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
```

**Validação do input:**
- Tipo: `number`
- Mínimo: `0`
- Máximo: `120` (10 anos)
- Placeholder centralizado: "Número de meses"
- Botão habilitado quando `value > 0`

