

## Plano: Substituir Imagens do Cerebro com Suporte a Dark/Light Mode

### Objetivo
Substituir a imagem atual do cerebro (`brain-science.png`) por duas novas versoes otimizadas (1024x1024px, menos padding) que funcionam melhor para cada tema:
- **Modo claro**: contorno cinza da cabeca
- **Modo escuro**: contorno roxo/lavanda da cabeca

Isso eliminara o scroll excessivo causado pelo padding da imagem anterior.

---

### 1. Copiar as Novas Imagens para Assets

**Arquivos a criar:**

| Origem | Destino |
|--------|---------|
| `user-uploads://Cópia_de_Mockups_aleatórios_1024_x_1024_px.png` | `src/assets/onboarding/brain-science-light.png` |
| `user-uploads://Cópia_de_Mockups_aleatórios_1024_x_1024_px_1.png` | `src/assets/onboarding/brain-science-dark.png` |

---

### 2. Atualizar Screen11BehavioralScience.tsx

**Modificacoes:**

1. **Atualizar imports** - Importar ambas as imagens:
```typescript
import brainScienceLight from "@/assets/onboarding/brain-science-light.png";
import brainScienceDark from "@/assets/onboarding/brain-science-dark.png";
```

2. **Renderizar imagens condicionalmente** - Usar classes CSS para mostrar/esconder baseado no tema:
```tsx
{/* Brain illustration - Light mode */}
<img
  src={brainScienceLight}
  alt="Cérebro com sistemas comportamentais"
  className="w-full max-w-xs dark:hidden"
  draggable={false}
/>

{/* Brain illustration - Dark mode */}
<img
  src={brainScienceDark}
  alt="Cérebro com sistemas comportamentais"
  className="w-full max-w-xs hidden dark:block"
  draggable={false}
/>
```

3. **Remover imagem antiga** (opcional) - Deletar `src/assets/onboarding/brain-science.png` que nao sera mais usada.

---

### 3. Diagrama do Resultado

```text
ANTES:                           DEPOIS:
+---------------------------+    +---------------------------+
|                           |    |  Titulo gradiente         |
|   [muito padding]         |    +---------------------------+
|                           |    |                           |
|   [BRAIN IMAGE antiga]    |    |   [BRAIN IMAGE otimizada] |
|                           |    |   (light OU dark mode)    |
|   [muito padding]         |    |                           |
|                           |    +---------------------------+
+---------------------------+    |  Card 1                   |
|   ... scroll necessario   |    +---------------------------+
|   para ver cards          |    |  Card 2                   |
+---------------------------+    +---------------------------+
                                 |  Card 3                   |
                                 +---------------------------+
                                 |  [Continuar]              |
                                 +---------------------------+
                                 
                                 Tudo visivel sem scroll!
```

---

### 4. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/assets/onboarding/brain-science-light.png` | **CRIAR** (copiar imagem modo claro) |
| `src/assets/onboarding/brain-science-dark.png` | **CRIAR** (copiar imagem modo escuro) |
| `src/components/onboarding/screens/phase1/Screen11BehavioralScience.tsx` | **MODIFICAR** - Atualizar imports e renderizar condicionalmente |
| `src/assets/onboarding/brain-science.png` | **DELETAR** (opcional - imagem antiga) |

---

### Secao Tecnica

**Codigo atualizado para a secao da imagem:**

```tsx
import brainScienceLight from "@/assets/onboarding/brain-science-light.png";
import brainScienceDark from "@/assets/onboarding/brain-science-dark.png";

// ... dentro do componente:

{/* Brain illustration */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="flex justify-center mb-8"
>
  {/* Light mode image */}
  <img
    src={brainScienceLight}
    alt="Cérebro com sistemas comportamentais"
    className="w-full max-w-xs dark:hidden"
    draggable={false}
  />
  {/* Dark mode image */}
  <img
    src={brainScienceDark}
    alt="Cérebro com sistemas comportamentais"
    className="w-full max-w-xs hidden dark:block"
    draggable={false}
  />
</motion.div>
```

**Por que usar `dark:hidden` / `hidden dark:block`?**
- Aproveita o sistema de temas do Tailwind (ja configurado no projeto via `next-themes`)
- Nao requer JavaScript adicional para detectar o tema
- Ambas as imagens sao pre-carregadas, garantindo transicao suave se o usuario trocar de tema
- Padrao comum usado em outros lugares do projeto

