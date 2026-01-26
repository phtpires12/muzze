

## Plano: Implementar Tela 9 do Onboarding (Diferencial + Rating)

### Visao Geral

Esta tela apresenta uma comparacao visual entre "Outros Apps" e "Muzze", destacando os diferenciais do produto, seguida de um pedido de avaliacao na App Store. Layout baseado no wireframe fornecido com dois cards lado a lado (lilás vs gradiente).

---

### 1. Criar Componente Screen7Diferencial

**Arquivo:** `src/components/onboarding/screens/phase1/Screen7Diferencial.tsx`

**Props:**
```typescript
interface Screen7DiferencialProps {
  onContinue: () => void;  // Quando clica em "Avaliar"
  onSkip: () => void;      // Quando clica em "Agora não"
  onBack: () => void;
  progress: number;
}
```

**Layout Visual (baseado no wireframe):**

```text
+-----------------------------------------+
|  <-                                     |  <- Back button
+-----------------------------------------+
|                                         |
|  Nos super te entendemos!               |  <- Subtitle (muted)
|  E esse e o nosso diferencial!          |
|                                         |
|  Somos o primeiro app                   |  <- Title (bold)
|  pensado pra voce, criador.             |     "pensado pra voce, criador"
|                                         |       em gradiente
|  +----------------+  +----------------+ |
|  | Em             |->| 🌿 muzze       | |
|  | outros Apps:   |  |                | |
|  |                |  | ✓ Voce usa um  | |
|  | ✗ Voce gasta   |  |   sistema de   | |
|  |   horas...     |  |   criacao      | |
|  |                |  |   Plug-n-Play  | |
|  | ✗ Nao querem   |  |                | |
|  |   saber...     |  | ✓ Te pergunta- | |
|  |                |  |   mos sobre... | |
|  | ✗ Nao sabem    |  |                | |
|  |   seus...      |  | ✓ Apoiamos...  | |
|  |                |  |                | |
|  | ✗ Te deixam    |  | ✓ Te entrega-  | |
|  |   sozinho...   |  |   mos...       | |
|  +----------------+  +----------------+ |
|        (lilas)            (gradiente)   |
|                                         |
|  Nos avalie na app store e nos          |
|  ajude a espalhar nossa missao!         |
|                                         |
|  +---------------------------------+    |
|  |           Avaliar               |    |  <- Primary button (gradient-pill)
|  +---------------------------------+    |
|                                         |
|         Agora nao (underline)           |  <- Secondary text button
+-----------------------------------------+
```

**Comportamento:**
1. "Avaliar" abre URL da App Store e avanca para proxima tela
2. "Agora nao" apenas avanca para proxima tela (pula avaliacao)
3. Seta curva entre os cards (SVG ou icone)

**Estilizacao dos Cards:**

| Card | Background | Texto | Icones |
|------|-----------|-------|--------|
| Outros Apps | `bg-violet-100/80` com borda `border-violet-200` | `text-gray-700` | ✗ em vermelho/cinza |
| Muzze | `bg-gradient-to-br from-orange-400 to-pink-500` | `text-white` | ✓ em branco |

**Elementos especificos:**
- Logo Muzze (folha branca + texto "muzze") no header do card direito
- Seta curva apontando do card esquerdo para o direito (ArrowRight ou SVG customizado)
- Texto "pensado pra voce, criador" com gradiente aplicado via CSS

---

### 2. Atualizar SCREENS_PER_PHASE

**Arquivo:** `src/types/onboarding.ts`

Incrementar Phase 0 para 7 telas:

```typescript
// De: [6, 5, 5, 5, 2, 6]
// Para: [7, 5, 5, 5, 2, 6]
export const SCREENS_PER_PHASE = [7, 5, 5, 5, 2, 6];
```

---

### 3. Atualizar NewOnboarding.tsx

**Arquivo:** `src/pages/NewOnboarding.tsx`

**Adicionar import:**
```typescript
import { Screen7Diferencial } from "@/components/onboarding/screens/phase1/Screen7Diferencial";
```

**Adicionar renderizacao para Phase 0, Screen 6:**
```typescript
// Apos o bloco de Screen 5 (StickingPoints)
if (state.phase === 0 && state.screen === 6) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen7Diferencial
        onContinue={handleContinue}  // Apos "Avaliar"
        onSkip={handleContinue}      // Apos "Agora nao"
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
  // ... existing screens 0-5 ...
  if (screen === 6) return false; // Botoes internos controlam navegacao
}
```

---

### 4. Constantes para o Conteudo

**Definir no componente:**

```typescript
const OTHER_APPS_CONS = [
  'Voce gasta horas construindo "templates" e nem usa.',
  'Nao querem saber se voce postou ou nao',
  'Nao sabem seus objetivos, nem acompanham seu progresso',
  'Te deixam sozinho, tentando achar um caminho.',
];

const MUZZE_PROS = [
  'Voce usa um sistema de criacao Plug-n-Play',
  'Te perguntamos sobre o status das suas criacoes',
  'Apoiamos seus sonhos como criador de conteudo',
  'Te entregamos o processo criativo das suas maiores referencias.',
];
```

---

### 5. Diagrama do Fluxo Atualizado (Phase 0)

```text
Screen 0: Welcome
    |
    v
Screen 1: HowWeHelpSection (3 steps internos)
    |
    v
Screen 2: StartQuestionnaire (transicao)
    |
    v
Screen 3: Username (input)
    |
    v
Screen 4: ContentGoal (single-select com toggle)
    |
    v
Screen 5: StickingPoints (multi-select)
    |
    v
Screen 6: Diferencial + Rating  <-- NOVA TELA 9
    |
    v
Phase 1, Screen 0: ...
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen7Diferencial.tsx` | **CRIAR** |
| `src/types/onboarding.ts` | MODIFICAR - Atualizar SCREENS_PER_PHASE |
| `src/pages/NewOnboarding.tsx` | MODIFICAR - Adicionar renderizacao e validacao |

---

### Secao Tecnica

**Estilo do gradiente no texto "pensado pra voce, criador":**
```css
background: linear-gradient(to right, #ec4899, #f97316, #eab308);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

**Estrutura dos Cards (usando flex):**
```typescript
<div className="flex gap-2 relative">
  {/* Card Outros Apps */}
  <div className="flex-1 bg-violet-100/80 border border-violet-200 rounded-2xl p-4">
    <h3 className="font-bold text-sm text-gray-800 mb-3">
      Em<br/>outros Apps:
    </h3>
    <ul className="space-y-3">
      {OTHER_APPS_CONS.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
  
  {/* Seta no meio */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
    <ArrowRight className="w-6 h-6 text-gray-400" />
  </div>
  
  {/* Card Muzze */}
  <div className="flex-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-4">
    <div className="flex items-center gap-1.5 mb-3">
      <img src={muzzeLeafWhite} className="w-5 h-5" />
      <span className="text-white font-bold">muzze</span>
    </div>
    <ul className="space-y-3">
      {MUZZE_PROS.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-white">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
</div>
```

**URL da App Store (placeholder para producao):**
```typescript
const handleReview = () => {
  // Em producao: URL real da App Store
  window.open("https://apps.apple.com/app/muzze", "_blank");
  onContinue();
};
```

