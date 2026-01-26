
## Plano: Implementar Tela 12 do Onboarding (Doeu/Caminho/Maquina)

### Visao Geral

Esta tela exibe uma das 3 variantes baseadas no `screen12_variant` definido na Tela 11 (Constancia). Cada variante tem um tom diferente para conectar com o usuario baseado em seu nivel de consistencia:

| Variante | Cluster | Titulo | Tom |
|----------|---------|--------|-----|
| `hurt` | 1 | "Uii! Doeu um pouco ver isso?" | Acolhedor, sem pressao |
| `path` | 2 | "Que otimo!! Voce ja ta no caminho" | Encorajador |
| `machine` | 3 | "Voce e uma maquina!" | Celebrativo, parceria |

---

### 1. Criar Componente Screen10ClusterFeedback

**Arquivo:** `src/components/onboarding/screens/phase1/Screen10ClusterFeedback.tsx`

**Props:**
```typescript
interface Screen10ClusterFeedbackProps {
  variant: 'hurt' | 'path' | 'machine';
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
|                                         |
|              [Emoji Cluster]            |  <- 3 emojis em circulos
|                  🤯                     |     roxos organizados
|               👊    😵                  |     em triangulo
|                                         |
|                                         |
|                                         |
|   [Titulo em bold]                      |  <- Muda por variante
|                                         |
|   [Texto de apoio revelado]             |  <- Aparece com tap/delay
|                                         |
|                                         |
|  +-----------------------------------+  |
|  |           Continuar               |  |  <- Botao roxo solido
|  +-----------------------------------+  |
+-----------------------------------------+
```

---

### 2. Conteudo por Variante

**Variante "hurt" (Cluster 1 - Sem Constancia):**
```
Titulo: "Uii! Doeu um pouco ver isso?"
Texto: "Fica tranquilo, nos sabemos que voce esta dando o seu melhor!

E estamos aqui pra ajudar criadores como voce, a nunca mais parar de criar."
```

**Variante "path" (Cluster 2 - Em Construcao):**
```
Titulo: "Que otimo!! Voce ja ta no caminho"
Texto: "Vamos te ajudar a aumentar isso pra acelerar ainda mais seus resultados!"
```

**Variante "machine" (Cluster 3 - Alta Constancia):**
```
Titulo: "Voce e uma maquina!"
Texto: "Ja da ate pra ensinar a galera a criar mais em...

Conta com a gente pra produzir conteudo pra esse publico. 🤝"
```

---

### 3. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 0 para 10 telas:

```typescript
// De: [9, 5, 5, 5, 2, 6]
// Para: [10, 5, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [10, 5, 5, 5, 2, 6];
```

---

### 4. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen10ClusterFeedback } from "@/components/onboarding/screens/phase1/Screen10ClusterFeedback";
```

**Adicionar renderizacao para Phase 0, Screen 9:**

Apos o bloco de Screen 8 (Constancia):

```typescript
if (state.phase === 0 && state.screen === 9) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen10ClusterFeedback
        variant={state.data.screen12_variant || "hurt"}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </>
  );
}
```

**Atualizar canContinue():**

```typescript
if (phase === 0) {
  // ... existing screens 0-8 ...
  if (screen === 9) return false; // ClusterFeedback - botao interno
}
```

**Atualizar renderScreen():**

```typescript
if (screen === 9) return null; // ClusterFeedback renderiza fora do OnboardingLayout
```

---

### 5. Diagrama do Fluxo Atualizado (Phase 0)

```text
Screen 0: Welcome
    |
    v
Screen 1-7: ... (outras telas)
    |
    v
Screen 8: Constancia (Tela 11)
    |
    +---> cluster 1 --------> Screen 9: "Doeu ver isso?" (hurt)
    |
    +---> cluster 2 --------> Screen 9: "Caminho" (path)
    |
    +---> cluster 3 --------> Screen 9: "Maquina!" (machine)
    |
    v
Phase 1, Screen 0: ...
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen10ClusterFeedback.tsx` | **CRIAR** |
| `src/types/onboarding.ts` | MODIFICAR - Atualizar SCREENS_PER_PHASE para [10, 5, 5, 5, 2, 6] |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar import, renderizacao e validacao |

---

### Secao Tecnica

**Estrutura do componente:**

```typescript
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen12Variant } from "@/types/onboarding";

interface Screen10ClusterFeedbackProps {
  variant: Screen12Variant;
  onContinue: () => void;
  onBack: () => void;
}

const VARIANT_CONTENT = {
  hurt: {
    title: "Uii! Doeu um pouco ver isso?",
    lines: [
      "Fica tranquilo, nos sabemos que voce esta dando o seu melhor!",
      "E estamos aqui pra ajudar criadores como voce, a nunca mais parar de criar.",
    ],
    emojis: ["🤯", "👊", "😵"],
  },
  path: {
    title: "Que otimo!! Voce ja ta no caminho",
    lines: [
      "Vamos te ajudar a aumentar isso pra acelerar ainda mais seus resultados!",
    ],
    emojis: ["🤯", "👊", "😵"],
  },
  machine: {
    title: "Voce e uma maquina!",
    lines: [
      "Ja da ate pra ensinar a galera a criar mais em...",
      "Conta com a gente pra produzir conteudo pra esse publico. 🤝",
    ],
    emojis: ["🤯", "👊", "😵"],
  },
};

export const Screen10ClusterFeedback = ({
  variant,
  onContinue,
  onBack,
}: Screen10ClusterFeedbackProps) => {
  const [revealed, setRevealed] = useState(false);
  const content = VARIANT_CONTENT[variant];

  const handleTap = () => {
    if (!revealed) {
      setRevealed(true);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] bg-violet-50 flex flex-col"
      onClick={handleTap}
    >
      {/* Header with back button */}
      <div className="px-4 pt-12 sm:pt-16">
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} ...>
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Emoji Cluster - 3 emojis in purple circles */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div className="relative w-48 h-48 mb-8">
          {/* Emoji circles arranged in triangle pattern */}
          {/* Top center emoji */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 ...">
            <span className="text-3xl">🤯</span>
          </div>
          {/* Bottom left emoji */}
          <div className="absolute bottom-0 left-0 ...">
            <span className="text-3xl">👊</span>
          </div>
          {/* Bottom right emoji */}
          <div className="absolute bottom-0 right-0 ...">
            <span className="text-3xl">😵</span>
          </div>
        </motion.div>
      </div>

      {/* Text content at bottom */}
      <div className="px-6 pb-8 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          {content.title}
        </h1>
        
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              {content.lines.map((line, i) => (
                <p key={i} className="text-muted-foreground">{line}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={(e) => { e.stopPropagation(); onContinue(); }}
          className="w-full bg-primary hover:bg-primary/90 rounded-full"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
```

**Elementos visuais dos emojis (baseado no wireframe):**
- 3 circulos roxos (`bg-violet-400`) organizados em triangulo
- Emojis: 🤯 (exploding head), 👊 (fist bump), 😵 (dizzy face)
- Animacao de entrada com scale + fade

**Interacao de revelacao:**
- Titulo aparece imediatamente
- Texto adicional aparece apos tap em qualquer lugar da tela
- Botao "Continuar" sempre visivel (roxo solido, nao gradiente)

**Estilo do botao (baseado no wireframe):**
- Background roxo solido (`bg-primary`)
- Nao usa gradiente nesta tela (diferente das outras)
- Rounded full (pill style)
