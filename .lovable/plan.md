

## Plano: Corrigir Layout da Tela 12 (Cluster Feedback)

### Problema Principal
A composicao triangular esta invertida. O codigo atual coloca 1 circulo em cima e 2 embaixo, mas o wireframe mostra 2 em cima e 1 embaixo centralizado.

---

### 1. Corrigir Estrutura VARIANT_CONTENT

Adicionar emojis especificos para cada variacao:

```typescript
const VARIANT_CONTENT = {
  hurt: {
    title: "Uii! Doeu um pouco ver isso?",
    lines: [...],
    emojis: ["😵‍💫", "👊", "😵"], // Emojis especificos para hurt
  },
  path: {
    title: "Que otimo!! Voce ja ta no caminho",
    lines: [...],
    emojis: ["😵‍💫", "👊", "😵"], // Emojis especificos para path
  },
  machine: {
    title: "Voce e uma maquina!",
    lines: [...],
    emojis: ["😵‍💫", "👊", "😵"], // Emojis especificos para machine
  },
};
```

Remover a constante `EMOJIS` fixa (linha 36).

---

### 2. Corrigir Posicionamento dos Circulos

**De (atual - triangulo normal):**
```
      ●        <- top-0 left-1/2
    ●   ●      <- bottom-0 left-2 | bottom-0 right-2
```

**Para (correto - triangulo invertido):**
```
    ●   ●      <- top-0 left-4 | top-0 right-4
      ●        <- bottom-0 left-1/2
```

**Codigo corrigido para os circulos:**

```tsx
{/* Container dos circulos - triangulo invertido */}
<motion.div
  className="relative w-44 h-36 mb-8"
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {/* Circulo superior ESQUERDO */}
  <motion.div
    className="absolute top-0 left-0 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
  >
    <span className="text-3xl">{content.emojis[0]}</span>
  </motion.div>

  {/* Circulo superior DIREITO */}
  <motion.div
    className="absolute top-0 right-0 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
  >
    <span className="text-3xl">{content.emojis[1]}</span>
  </motion.div>

  {/* Circulo inferior CENTRALIZADO */}
  <motion.div
    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
  >
    <span className="text-3xl">{content.emojis[2]}</span>
  </motion.div>
</motion.div>
```

---

### 3. Ajustes de Estilo

- Remover `shadow-lg` dos circulos (wireframe mostra flat, sem sombra forte)
- Ajustar container de `w-48 h-40` para `w-44 h-36` para os circulos ficarem mais proximos
- Manter `bg-primary/70` para cor roxa consistente

---

### Diagrama Visual da Correcao

```
ANTES (errado):           DEPOIS (correto):

      🤯                      😵‍💫  👊
                     -->         
    👊    😵                    😵
```

---

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen10ClusterFeedback.tsx` | MODIFICAR - Inverter triangulo + emojis por variacao |

---

### Pergunta Importante

Quais sao os emojis corretos para cada variacao? O codigo atual usa `["🤯", "👊", "😵"]` para todas. Voce mencionou `["😵‍💫", "👊", "😵"]` no exemplo - esses sao os emojis corretos? Ou cada variacao (hurt/path/machine) tem emojis diferentes?

Se todos usam os mesmos emojis, posso manter como constante. Se cada variacao tem emojis unicos, preciso que voce confirme quais sao.

