
# Reconstruir tela de Paywall (Screen25Paywall) no estilo do novo onboarding

## Problema atual

A tela de paywall atual (Screen25Paywall) tem dois botoes "Voltar" redundantes (um do OnboardingLayout e outro interno), usa animacao de logo/sino sem contexto visual do app, e nao segue o padrao de design do novo onboarding. O wireframe mostra um design completamente diferente: titulo bold no topo, PhoneMockup centralizado com imagens rotativas mostrando telas reais do app, e CTA fixo no bottom.

## Nova estrutura visual

```text
+----------------------------------+
|              Restaurar compra    |  <- link discreto top-right
|                                  |
| Experimente a Muzze              |  <- titulo bold, centralizado
|    gratuitamente.                |
|                                  |
|      +--------------------+      |
|      |   [iPhone Mockup]  |      |  <- PhoneMockup com auto-rotate
|      |   imagens rotativas|      |     4 imagens: Home, Calendar,
|      |   a cada ~4s       |      |     Stats, Ofensiva
|      +--------------------+      |
|                                  |
| Sem cobranca agora               |  <- check verde + texto
|                                  |
| [==Experimente por R$0.00===]    |  <- gradient-pill CTA
|                                  |
| Depois R$298,80/ano (R$24,90/mes)|  <- texto xs muted
+----------------------------------+
```

## Mudancas

### 1. Copiar as 4 imagens de mockup para src/assets/paywall/

As imagens enviadas pelo usuario serao copiadas para o projeto:
- `user-uploads://Mockup_Iphone_-_Home.png` -> `src/assets/paywall/mockup-home.png`
- `user-uploads://Mockup_Iphone_Calendar.png` -> `src/assets/paywall/mockup-calendar.png`
- `user-uploads://Mockup_Iphone_Stats.png` -> `src/assets/paywall/mockup-stats.png`
- `user-uploads://Mockup_Iphone_Ofensiva.png` -> `src/assets/paywall/mockup-ofensiva.png`

### 2. Reescrever `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

Layout completo (tela unica, sem step 1/step 2):

- **Fundo**: `min-h-[100dvh] bg-violet-50 dark:bg-background` (padrao onboarding)
- **Header**: apenas link "Restaurar compra" no canto superior direito (texto discreto, sem botao de voltar -- o paywall e a ultima barreira antes da conversao, nao deve facilitar sair)
- **Titulo**: "Experimente a Muzze gratuitamente." centralizado, bold, text-2xl/3xl
- **PhoneMockup**: centralizado, usando o componente PhoneMockup existente com `screenImage`. Auto-rotacao a cada 4 segundos entre as 4 imagens (Home, Calendar, Stats, Ofensiva) com transicao de opacity crossfade (framer-motion AnimatePresence)
- **Bottom CTA fixo**:
  - Icone check verde + "Sem cobranca agora"
  - Botao gradient-pill "Experimente por R$0.00" (chama `onContinue`)
  - Texto xs "Depois R$298,80 por ano (R$24,90/mes)"

- **Props**: manter `onContinue` e `onBack` (onBack sera usado pelo botao dev skip). Adicionar `showDevSkip` e `onDevSkip` para admin bypass.

- **Auto-rotacao**: `useEffect` com `setInterval(4000)` incrementando um indice, `useState` para `currentImageIndex`. As imagens fazem crossfade com framer-motion `AnimatePresence` + `motion.img` com opacity transition.

### 3. Atualizar `src/pages/NewOnboarding.tsx`

A tela de paywall (phase 2, screen 1) atualmente renderiza dentro do OnboardingLayout (que adiciona o botao "Voltar" extra). Mover para renderizar fora do OnboardingLayout, como as demais telas, passando `showDevSkip` e `onDevSkip`.

## Detalhes tecnicos

### Interface atualizada:
```typescript
interface Screen25PaywallProps {
  onContinue: () => void;
  onBack?: () => void;
  showDevSkip?: boolean;
  onDevSkip?: () => void;
}
```

### Auto-rotacao de imagens:
```typescript
const images = [mockupHome, mockupCalendar, mockupStats, mockupOfensiva];
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, 4000);
  return () => clearInterval(interval);
}, []);
```

### Crossfade no PhoneMockup:
Usar `AnimatePresence` com `motion.img` dentro do PhoneMockup via `children` prop, para que as imagens facam crossfade suave dentro do mockup sem recriar o frame.

### Renderizacao no NewOnboarding.tsx:
Adicionar bloco condicional antes do `return <OnboardingLayout>`:
```typescript
if (state.phase === 2 && state.screen === 1) {
  return (
    <>
      {/* Developer Badge */}
      ...
      <Screen25Paywall
        onContinue={handlePaywallComplete}
        onBack={handleBack}
        showDevSkip={isDeveloper || isAdmin}
        onDevSkip={handleContinue}
      />
    </>
  );
}
```

E remover a renderizacao do Screen25Paywall de dentro do `renderScreen()`.
