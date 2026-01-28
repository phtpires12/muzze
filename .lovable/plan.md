

## Plano: Substituir Emojis CSS por Ilustracoes na Tela 12

### Objetivo

Substituir a estrutura de 3 circulos CSS com emojis de texto por 3 imagens ilustradas (uma para cada variante). As imagens ja contem o layout completo do cluster de emojis em circulos roxos, entao funcionarao como assets estaticos.

---

### 1. Copiar Imagens para Assets

**Arquivos a criar:**

| Origem | Destino |
|--------|---------|
| `user-uploads://Doeu_-_sem_padding.png` | `src/assets/onboarding/cluster-hurt.png` |
| `user-uploads://Caminho_-_Sem_Padding.png` | `src/assets/onboarding/cluster-path.png` |
| `user-uploads://Máquina_-_Sem_Padding.png` | `src/assets/onboarding/cluster-machine.png` |

---

### 2. Modificar Screen10ClusterFeedback.tsx

**Mudancas principais:**

1. **Adicionar imports das 3 imagens:**
```typescript
import clusterHurt from "@/assets/onboarding/cluster-hurt.png";
import clusterPath from "@/assets/onboarding/cluster-path.png";
import clusterMachine from "@/assets/onboarding/cluster-machine.png";
```

2. **Criar mapeamento de imagens por variante:**
```typescript
const VARIANT_IMAGES = {
  hurt: clusterHurt,
  path: clusterPath,
  machine: clusterMachine,
};
```

3. **Substituir a estrutura CSS por uma unica imagem:**

Remover:
```tsx
{/* Emoji Cluster - 3 emojis in purple circles - inverted triangle */}
<div className="flex-1 flex flex-col items-center justify-center px-6">
  <motion.div className="relative w-44 h-36 mb-8" ...>
    {/* Top left emoji */}
    <motion.div className="absolute top-0 left-0 w-20 h-20 bg-primary/70 rounded-full...">
      <span className="text-3xl">{content.emojis[0]}</span>
    </motion.div>
    {/* ... mais 2 emojis ... */}
  </motion.div>
</div>
```

Adicionar:
```tsx
{/* Emoji Cluster - Image illustration */}
<div className="flex-1 flex flex-col items-center justify-center px-6">
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="flex justify-center mb-8"
  >
    <img
      src={VARIANT_IMAGES[variant]}
      alt="Ilustração de emojis"
      className="w-full max-w-[240px]"
      draggable={false}
    />
  </motion.div>
</div>
```

4. **Remover array de emojis do VARIANT_CONTENT** (nao mais necessario):
```typescript
const VARIANT_CONTENT = {
  hurt: {
    title: "Uii! Doeu um pouco ver isso?",
    lines: [...],
    // emojis: [...] <- REMOVER
  },
  // ...
};
```

---

### 3. Layout Visual Atualizado

Baseado no wireframe enviado:

```text
+------------------------------------------+
|  <-                                      |  <- Back button
+------------------------------------------+
|                                          |
|                                          |
|          [CLUSTER IMAGE]                 |  <- Imagem da ilustracao
|          (centralizada)                  |     (varia por variant)
|                                          |
|                                          |
+------------------------------------------+
|                                          |
|  Uii! Doeu um pouco ver isso?            |  <- Titulo (bold)
|                                          |
|  Fica tranquilo, nos sabemos que         |  <- Texto revelado
|  voce esta dando o seu melhor!           |     (tap to reveal)
|  E estamos aqui pra ajudar...            |
|                                          |
|  +------------------------------------+  |
|  |           Continuar                |  |  <- Botao roxo
|  +------------------------------------+  |
+------------------------------------------+
```

---

### 4. Ajustes de Tamanho

| Aspecto | Valor |
|---------|-------|
| Tamanho da imagem | `max-w-[240px]` (ajustavel conforme teste) |
| Margin bottom | `mb-8` (espaco entre imagem e texto) |

---

### 5. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/assets/onboarding/cluster-hurt.png` | **CRIAR** (copiar imagem) |
| `src/assets/onboarding/cluster-path.png` | **CRIAR** (copiar imagem) |
| `src/assets/onboarding/cluster-machine.png` | **CRIAR** (copiar imagem) |
| `src/components/onboarding/screens/phase1/Screen10ClusterFeedback.tsx` | **MODIFICAR** |

---

### Secao Tecnica

**Codigo completo atualizado:**

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen12Variant } from "@/types/onboarding";

// Import cluster images
import clusterHurt from "@/assets/onboarding/cluster-hurt.png";
import clusterPath from "@/assets/onboarding/cluster-path.png";
import clusterMachine from "@/assets/onboarding/cluster-machine.png";

interface Screen10ClusterFeedbackProps {
  variant: Screen12Variant;
  onContinue: () => void;
  onBack: () => void;
}

const VARIANT_IMAGES = {
  hurt: clusterHurt,
  path: clusterPath,
  machine: clusterMachine,
};

const VARIANT_CONTENT = {
  hurt: {
    title: "Uii! Doeu um pouco ver isso?",
    lines: [
      "Fica tranquilo, nos sabemos que voce esta dando o seu melhor!",
      "E estamos aqui pra ajudar criadores como voce, a nunca mais parar de criar.",
    ],
  },
  path: {
    title: "Que otimo!! Voce ja ta no caminho",
    lines: [
      "Vamos te ajudar a aumentar isso pra acelerar ainda mais seus resultados!",
    ],
  },
  machine: {
    title: "Voce e uma maquina!",
    lines: [
      "Ja da ate pra ensinar a galera a criar mais em...",
      "Conta com a gente pra produzir conteudo pra esse publico. 🤝",
    ],
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
      className="min-h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col overflow-hidden"
      onClick={handleTap}
    >
      {/* Header with back button */}
      <div className="px-4 pt-12 sm:pt-16">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-secondary/80 shadow-sm"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Emoji Cluster - Image illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center"
        >
          <img
            src={VARIANT_IMAGES[variant]}
            alt="Ilustracao de emojis"
            className="w-full max-w-[240px]"
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Text content at bottom */}
      <div className="px-6 pb-8 space-y-4">
        {/* ... resto do codigo permanece igual ... */}
      </div>
    </div>
  );
};
```

**Vantagens desta abordagem:**

1. **Consistencia visual** - As ilustracoes ficam identicas em todos os dispositivos
2. **Simplicidade** - Menos codigo CSS para manter
3. **Flexibilidade** - Facil trocar ilustracoes no futuro
4. **Padrao do projeto** - Mesmo approach usado no cerebro (Tela 13) e no iPhone mockup

