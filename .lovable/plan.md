
# Plano: Corrigir Posicionamento do Botão de Concluir Edição

## Problema Identificado

O botão "Marcar como Editado" está fixo no bottom da tela e fica encoberto/competindo com a barra de navegação inferior (AutoHideNav).

Isso acontece porque:
1. A rota `/editing-workspace` **não está incluída** na lista de `isOnSessionPage`
2. Portanto, a navegação fica sempre visível (não faz auto-hide)
3. Ambos elementos estão posicionados no bottom, causando sobreposição

## Solução Proposta

Há duas abordagens possíveis:

| Abordagem | Descrição | Prós | Contras |
|-----------|-----------|------|---------|
| **A: Adicionar editing-workspace ao isOnSessionPage** | A navegação fará auto-hide durante sessão de edição | Comportamento consistente com outras páginas de sessão | Usuário precisa fazer hover para ver nav |
| **B: Ajustar padding do botão para ficar acima da nav** | Botão fica sempre visível acima da navegação | Sempre acessível | Ocupa mais espaço vertical |

**Recomendação: Abordagem A** - é mais consistente com o padrão de outras páginas de sessão ativa onde a navegação faz auto-hide.

## Alterações Necessárias

| Arquivo | Alteração |
|---------|-----------|
| `src/components/AutoHideNav.tsx` | Adicionar `/editing-workspace` à lista de `isOnSessionPage` |
| `src/components/SideNav.tsx` | Adicionar `/editing-workspace` à lista de `isOnSessionPage` |
| `src/pages/EditingWorkspace.tsx` | Remover container fixo do botão e movê-lo para dentro do fluxo do conteúdo |

## Detalhes Técnicos

### 1. Atualizar isOnSessionPage (AutoHideNav.tsx)

```typescript
// ANTES
const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review'].some(
  path => location.pathname.startsWith(path)
);

// DEPOIS
const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review', '/editing-workspace'].some(
  path => location.pathname.startsWith(path)
);
```

### 2. Atualizar isOnSessionPage (SideNav.tsx)

```typescript
// ANTES
const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review'].some(
  path => location.pathname.startsWith(path)
);

// DEPOIS
const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review', '/editing-workspace'].some(
  path => location.pathname.startsWith(path)
);
```

### 3. Remover container fixo do botão (EditingWorkspace.tsx)

Em vez de posicionar o botão como `fixed bottom-0`, vamos:
1. Remover o container fixo do botão
2. Adicionar o botão diretamente após o último painel (EditingNotesPanel)
3. Usar padding suficiente para garantir visibilidade

```typescript
// Fluxo do conteúdo atualizado
<div className="space-y-4">
  <ShotlistPanel ... />
  <MusicPanel ... />
  <EditingNotesPanel ... />
  
  {/* Botão inline com espaço para navegação */}
  <div className="pt-4 pb-8">
    <CompleteEditingButton ... />
  </div>
</div>
```

## Comportamento Resultante

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ANTES (problema)                                                       │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ ...conteúdo...                                                │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ [Botão Concluir - fixed bottom-0]         ← Encoberto!       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ [Navegação - fixed bottom + 1rem]         ← Por cima!        │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  DEPOIS (corrigido)                                                     │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ ...conteúdo...                                                │      │
│  │                                                                │      │
│  │ ┌────────────────────────────────────────────────────────────┐│      │
│  │ │ [Botão Concluir - inline no scroll]  ← Sempre visível!     ││      │
│  │ └────────────────────────────────────────────────────────────┘│      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  (navegação faz auto-hide, aparece ao passar mouse/scroll)              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Fluxo Mobile vs Desktop

| Dispositivo | Comportamento da Navegação | Botão |
|-------------|---------------------------|-------|
| **Mobile** | Sempre visível (fixa) | Inline com scroll, acima da nav pelo padding |
| **Desktop** | Auto-hide durante sessão | Inline com scroll, nav aparece no hover |

## Resultado Esperado

1. Botão "Marcar como Editado" sempre visível e clicável
2. Não há sobreposição com a navegação
3. Comportamento consistente com outras páginas de sessão
4. Funciona corretamente em mobile e desktop
