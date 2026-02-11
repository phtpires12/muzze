
# Ajustes na tela de Signup e botao dev skip

## Mudanca 1: Remover barra de progresso da tela "Crie sua conta"

**Arquivo**: `src/components/onboarding/screens/phase6/Screen21Signup.tsx`

- Remover o import do `GradientProgressBar`
- Remover a prop `progress` da interface (manter so `onSuccess` e `onBack`)
- No header, manter apenas o botao de voltar (ChevronLeft), sem a barra de progresso
- Simplificar o header para: back button alinhado a esquerda, sem barra

## Mudanca 2: Adicionar botao "Pular (Dev)" para admins/devs

**Arquivo**: `src/components/onboarding/screens/phase6/Screen21Signup.tsx`

- Receber uma nova prop opcional `showDevSkip?: boolean`
- Receber `onDevSkip?: () => void`
- Quando `showDevSkip` for true, renderizar um botao discreto "Pular (Dev)" com icone Shield, abaixo do link "Ja tem uma conta?", com estilo outline e cor primary (mesmo padrao do botao dev bypass que ja existe em outras telas do onboarding)

## Mudanca 3: Atualizar NewOnboarding.tsx

**Arquivo**: `src/pages/NewOnboarding.tsx`

- Na renderizacao do Screen21Signup (phase 2, screen 0), remover a prop `progress`
- Passar `showDevSkip={isDeveloper || isAdmin}` e `onDevSkip={handleContinue}`

## Detalhes tecnicos

### Screen21Signup - nova interface:
```
interface Screen21SignupProps {
  onSuccess: () => void;
  onBack: () => void;
  showDevSkip?: boolean;
  onDevSkip?: () => void;
}
```

### Header simplificado (sem progress bar):
```
<div className="flex items-center px-4 pt-4 pb-2">
  <button onClick={onBack} ...>
    <ChevronLeft />
  </button>
</div>
```

### Botao dev skip (condicional):
```
{showDevSkip && (
  <button onClick={onDevSkip} className="...border-primary/50 text-primary...">
    <Shield /> Pular (Dev)
  </button>
)}
```
