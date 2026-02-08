
# Plano: Correção Global de Safe Areas para iPhones

## Problema Identificado

Atualmente, cada página aplica safe areas de forma **inconsistente**:
- Algumas usam inline styles (`paddingTop: 'env(safe-area-inset-top)'`)
- Algumas usam classes CSS existentes (`.safe-area-top`)
- Algumas não aplicam nada

Isso resulta em elementos "colados" no notch/Dynamic Island e na barra home do iPhone.

## Solução Proposta

Criar um **wrapper global** no `App.tsx` que aplique safe areas automaticamente em **todas as rotas**, eliminando a necessidade de ajustes individuais por página.

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
├─────────────────────────────────────────────────────────────┤
│  <div className="safe-app">  ← Novo wrapper global          │
│    ├── RootLayout                                            │
│    │   └── <Outlet /> (todas as rotas)                      │
│    └── ProtectedRoute (loading state)                       │
│                                                              │
│  CSS aplica:                                                 │
│  ├── padding-top: env(safe-area-inset-top)                  │
│  ├── padding-bottom: env(safe-area-inset-bottom)            │
│  └── min-height: 100dvh                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AppLayout (com bottom nav)                 │
├─────────────────────────────────────────────────────────────┤
│  .safe-app.with-bottom-nav                                  │
│  └── padding-bottom extra para acomodar nav fixa            │
│      (safe-area-inset-bottom + --bottom-nav-height)         │
└─────────────────────────────────────────────────────────────┘
```

## Fase 1: CSS Global (index.css)

Adicionar as seguintes classes ao `src/index.css`:

```css
/* ===== GLOBAL SAFE AREA WRAPPER ===== */
:root {
  --bottom-nav-height: 5rem; /* 80px - altura da BottomNav */
}

.safe-app {
  min-height: 100vh;
  min-height: 100dvh;
  /* Fallback para iOS antigo */
  padding-top: constant(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-left: constant(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  /* iOS moderno */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Variante com bottom nav fixa (rotas que usam AppLayout) */
.safe-app.with-bottom-nav {
  padding-bottom: calc(
    env(safe-area-inset-bottom, 0px) + 
    var(--bottom-nav-height)
  );
}

/* Fallback iOS antigo para variante com bottom nav */
@supports (padding: constant(safe-area-inset-bottom)) {
  .safe-app.with-bottom-nav {
    padding-bottom: calc(
      constant(safe-area-inset-bottom) + 
      var(--bottom-nav-height)
    );
  }
}
```

## Fase 2: Modificar App.tsx

### 2.1 RootLayout - Adicionar wrapper global

```typescript
// Root layout component that wraps all routes with providers
const RootLayout = () => (
  <AppNavigationProvider>
    <WorkspaceContextProvider>
      <PlanContextProvider>
        <TutorialProvider>
          <GlobalCelebrations />
          <LevelUpModal />
          <TrophyUnlockedModal />
          <TutorialOverlay />
          {/* ✅ NOVO: Wrapper global com safe areas */}
          <div className="safe-app">
            <Outlet />
          </div>
        </TutorialProvider>
      </PlanContextProvider>
    </WorkspaceContextProvider>
  </AppNavigationProvider>
);
```

### 2.2 ProtectedRoute - Aplicar safe-app no loading

```typescript
if (loading) {
  return (
    <div className="safe-app min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-xl text-foreground">Carregando...</div>
    </div>
  );
}
```

## Fase 3: Modificar AppLayout (AppNavigation.tsx)

O AppLayout precisa indicar quando há bottom nav para aplicar padding extra:

```typescript
export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const { effectivePosition, isSidebarCollapsed } = useNavPosition();
  const hasSidebar = effectivePosition === 'side';
  const hasBottomNav = effectivePosition === 'bottom';

  return (
    <div 
      className={cn(
        "min-h-screen bg-background transition-all duration-300",
        hasSidebar 
          ? (isSidebarCollapsed ? "pl-16" : "pl-56") 
          : "", // Remover pb-20 - agora controlado globalmente
        className
      )}
      // ✅ Indicar ao wrapper pai que tem bottom nav
      data-has-bottom-nav={hasBottomNav}
    >
      <main className="h-full overflow-auto">{children}</main>
      <AppNavigation />
    </div>
  );
};
```

**Alternativa mais simples**: Como o RootLayout envolve o Outlet, podemos usar uma abordagem diferente - detectar se estamos numa rota com Layout e aplicar a classe condicionalmente via CSS ou contexto.

**Solução mais robusta**: Criar um hook/contexto que comunica ao wrapper se há bottom nav presente.

## Fase 4: Ajustar BottomNav.tsx

A BottomNav já usa `env(safe-area-inset-bottom)` no seu posicionamento:
```tsx
style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
```

Isso está correto. A nav se posiciona acima da home bar. O conteúdo da página precisa ter padding-bottom suficiente para não ficar escondido atrás dela.

## Fase 5: Limpeza de Safe Areas Duplicadas

Após a implementação global, podemos **opcionalmente** remover safe areas inline de páginas individuais como:
- `Session.tsx` (linha 365): `paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)'`
- `Ofensiva.tsx` (linha 386-388): inline styles no header
- `Index.tsx` (linha 423): `paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)'`
- `Levels.tsx` (linha 34, 38): inline styles duplicados

**Recomendação**: Manter essas páginas como estão inicialmente, pois elas adicionam padding **extra** além do safe area básico. O wrapper global garante o mínimo; páginas podem adicionar mais se necessário.

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/index.css` | Modificar | Adicionar `.safe-app` e `.safe-app.with-bottom-nav` |
| `src/App.tsx` | Modificar | Envolver Outlet com div.safe-app no RootLayout |
| `src/App.tsx` | Modificar | Aplicar safe-app no loading do ProtectedRoute |
| `src/components/AppNavigation.tsx` | Modificar | Ajustar AppLayout para não duplicar padding |

## Detalhes Técnicos

### Variável CSS para altura da bottom nav

```css
:root {
  --bottom-nav-height: 5rem; /* 80px */
}
```

Esta variável permite ajustar a altura da nav em um só lugar se necessário.

### Fallback para iOS antigo (iOS < 11.4)

O CSS usa `constant()` como fallback antes de `env()`:
```css
padding-top: constant(safe-area-inset-top);
padding-top: env(safe-area-inset-top, 0px);
```

### Suporte a viewport-fit=cover

O `index.html` já tem:
```html
<meta name="viewport" content="..., viewport-fit=cover" />
```

Isso é necessário para que `env(safe-area-inset-*)` funcione.

## Resultado Esperado

Após a implementação:

1. **Botão de voltar e headers** não ficam colados no notch/Dynamic Island
2. **CTAs e botões no rodapé** não encostam na home bar
3. **Funciona em todos os iPhones**: SE/8 (sem notch), X-14 (com notch), 14 Pro-17 Pro (Dynamic Island)
4. **Sem ajustes manuais por página** - o wrapper global cuida de tudo
5. **Rotas públicas** (`/onboarding`, `/auth`, `/install`) também protegidas

## Testes Recomendados

Verificar nos seguintes dispositivos/simuladores:
- iPhone SE (3rd gen) - sem notch
- iPhone 14 - com notch
- iPhone 15 Pro - com Dynamic Island
- iPhone em modo landscape (safe areas laterais)
