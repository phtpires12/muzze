
## Plano: Adicionar Botão de Voltar em Todas as Telas do Onboarding

### Problema Identificado

Várias telas do onboarding não possuem botão de voltar, impedindo navegação livre. Telas afetadas:

| Tela | Status Atual |
|------|-------------|
| Screen0Welcome | OK (primeira tela, não precisa) |
| HowWeHelpSection | Parcial (tem botão interno, mas não volta à Welcome) |
| Screen4StartQuestionnaire | **SEM botão voltar** |
| Screen2Username | OK |
| Screen5ContentGoal | OK |
| Telas Phase 1-5 | Depende da lógica `showBack` no OnboardingLayout |

---

### Alterações Necessárias

#### 1. Adicionar Botão Voltar no HowWeHelpSection

**Arquivo:** `src/pages/NewOnboarding.tsx`

Passar a prop `onBack={handleBack}` para que o usuário possa voltar à tela de Welcome:

```tsx
<HowWeHelpSection 
  onComplete={handleContinue} 
  onBack={handleBack}  // ADICIONAR
/>
```

O componente `HowWeHelpSection` já aceita `onBack` e repassa para `HowWeHelpStep`, que já exibe o botão quando `canGoBack={currentStep > 0 || !!onBack}`.

---

#### 2. Adicionar Botão Voltar na Screen4StartQuestionnaire

**Arquivo:** `src/components/onboarding/screens/phase1/Screen4StartQuestionnaire.tsx`

Atualizar a interface para receber `onBack`:

```tsx
interface Screen4StartQuestionnaireProps {
  onContinue: () => void;
  onBack?: () => void;  // ADICIONAR
}
```

Adicionar o botão no layout:

```tsx
<div className="flex flex-col items-center justify-between min-h-[70vh] ...">
  {/* Botão de voltar no topo */}
  {onBack && (
    <button
      onClick={onBack}
      className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
    >
      <ChevronLeft className="w-6 h-6" />
    </button>
  )}
  
  {/* Cards Section */}
  ...
</div>
```

**Arquivo:** `src/pages/NewOnboarding.tsx`

Passar a prop:

```tsx
<Screen4StartQuestionnaire 
  onContinue={handleContinue} 
  onBack={handleBack}  // ADICIONAR
/>
```

---

#### 3. Garantir Visibilidade do Botão no OnboardingLayout

**Arquivo:** `src/pages/NewOnboarding.tsx`

A lógica atual de `showBack` já está quase correta:

```tsx
const showBack = !(state.phase === 0 && state.screen === 0) 
  && !(state.phase === 5 && state.screen === 4) 
  && !(state.phase === 5 && state.screen === 5);
```

Isso significa que o botão de voltar aparece em todas as telas exceto:
- Welcome (Phase 0, Screen 0) - correto
- Paywall (Phase 5, Screen 4) - remover esta exceção
- Install (Phase 5, Screen 5) - remover esta exceção

**Nova lógica:**

```tsx
// Mostrar botão voltar em TODAS as telas exceto a primeira (Welcome)
const showBack = !(state.phase === 0 && state.screen === 0);
```

---

#### 4. Adicionar Botão Voltar nas Telas de Paywall e Install

**Arquivo:** `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

Se não tiver, adicionar suporte a `onBack`:

```tsx
interface Screen25PaywallProps {
  onContinue: () => void;
  onBack?: () => void;  // Verificar se já existe
}
```

**Arquivo:** `src/components/onboarding/screens/phase6/Screen26Install.tsx`

Adicionar suporte a `onBack`:

```tsx
interface Screen26InstallProps {
  onContinue: () => void;
  onBack?: () => void;  // ADICIONAR
}
```

---

### Resumo de Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/NewOnboarding.tsx` | Passar `onBack` para HowWeHelpSection e StartQuestionnaire; Simplificar lógica `showBack` |
| `src/components/onboarding/screens/phase1/Screen4StartQuestionnaire.tsx` | Adicionar botão de voltar |
| `src/components/onboarding/screens/phase6/Screen25Paywall.tsx` | Verificar/adicionar suporte a `onBack` |
| `src/components/onboarding/screens/phase6/Screen26Install.tsx` | Adicionar suporte a `onBack` |

---

### Resultado Esperado

Após a implementação:
- ✅ Todas as telas (exceto Welcome) terão botão de voltar
- ✅ O usuário poderá navegar livremente pelo onboarding
- ✅ Não será mais necessário completar todo o fluxo para retornar

---

### Secao Tecnica

**Componentes que já têm botão de voltar:**
- `Screen2Username` - ChevronLeft no header
- `Screen5ContentGoal` - ChevronLeft no header  
- `HowWeHelpStep` - Botão circular com ChevronLeft (posição absoluta top-12 left-4)
- `OnboardingLayout` - ArrowLeft no header (texto "Voltar")

**Padrão de estilo consistente para o botão:**
- Posição: canto superior esquerdo (top-4 left-4 ou similar)
- Ícone: `ChevronLeft` da biblioteca lucide-react
- Aparência: circular, com hover state (`hover:bg-muted` ou `hover:bg-secondary`)
- Tamanho do ícone: `w-6 h-6`
