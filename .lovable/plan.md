
# Plano: Visualização Completa de Cena (Estilo Notion)

## Objetivo

Permitir que o editor clique em qualquer cena da galeria e veja o texto completo do roteiro, sem truncamento, em uma visualização expandida estilo "página dentro de página" do Notion.

## Comportamento

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  GALERIA HORIZONTAL                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                          │
│  │   Cena 1   │ │   Cena 2   │ │   Cena 3   │ ← Clique aqui            │
│  │ "texto..." │ │ "texto..." │ │ "texto..." │                          │
│  └────────────┘ └────────────┘ └────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ (abre)
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ╔═══════════════════════════════════════════════════════════════╗ │  │
│  │ ║                     [THUMBNAIL 16:9]                          ║ │  │
│  │ ║                                                               ║ │  │
│  │ ╠═══════════════════════════════════════════════════════════════╣ │  │
│  │ ║  [Badge: Setup]                      Cena 3 de 12     [← →]   ║ │  │
│  │ ╠═══════════════════════════════════════════════════════════════╣ │  │
│  │ ║                                                               ║ │  │
│  │ ║  Oi eu sou o Tor4 e com a IA dominando tudo nos últimos       ║ │  │
│  │ ║  anos, aquilo que é handmade, aquilo que é artesanal,         ║ │  │
│  │ ║  aquilo que é feito por um ser humano real, tende a ser       ║ │  │
│  │ ║  cada vez mais valorizado. E é por isso que eu quero          ║ │  │
│  │ ║  compartilhar com você o meu processo criativo completo.      ║ │  │
│  │ ║                                                               ║ │  │
│  │ ║  ↑ TEXTO COMPLETO SEM TRUNCAMENTO                             ║ │  │
│  │ ║                                                               ║ │  │
│  │ ╠═══════════════════════════════════════════════════════════════╣ │  │
│  │ ║  🎬 Vincular Vídeo                                            ║ │  │
│  │ ║  [Input para colar link do Drive/Dropbox/YouTube]             ║ │  │
│  │ ╚═══════════════════════════════════════════════════════════════╝ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/editing/SceneDetailModal.tsx` | **Criar** | Novo componente para visualização completa |
| `src/components/editing/ShotlistPanel.tsx` | Modificar | Adicionar estado e handler de abertura |

## Detalhamento Técnico

### 1. Criar SceneDetailModal.tsx

Novo componente que renderiza:
- **Mobile**: `Drawer` (bottom sheet) com scroll interno
- **Desktop**: `Dialog` centralizado estilo Notion

Conteúdo do modal:
- Thumbnail 16:9 como "hero" (ou placeholder)
- Header com badge de seção + navegação (← Cena X de Y →)
- Texto completo do roteiro (sem `line-clamp`)
- Badge de locação (se houver)
- Área de vinculação de vídeo (mesma lógica do card)

### 2. Modificar ShotlistPanel.tsx

Adicionar:
- State: `selectedSceneIndex: number | null`
- Handler: `onCardClick(index)` → abre modal
- Navegação: funções `goToPrevious()` e `goToNext()`
- Renderizar `SceneDetailModal` controlado pelo state

### 3. Estrutura do SceneDetailModal

```typescript
interface SceneDetailModalProps {
  shot: ShotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  resolvedUrl?: string;
  currentIndex: number;
  totalScenes: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}
```

### 4. Detecção de Dispositivo

```typescript
import { useIsMobile } from "@/hooks/use-mobile";

function SceneDetailModal(props) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <SceneDetailDrawer {...props} />;
  }
  
  return <SceneDetailDialog {...props} />;
}
```

## Funcionalidades do Modal

1. **Texto Completo**: Exibe `stripHtml(shot.scriptSegment)` sem limite de linhas
2. **Navegação**: Setas ou swipe para ir para próxima/anterior cena
3. **Teclado**: Setas ← → para navegar, ESC para fechar
4. **Vinculação de Vídeo**: Mesma funcionalidade do card inline
5. **Badge de Seção**: Mostra "Gancho", "Setup", etc.
6. **Indicador de Posição**: "Cena 3 de 12"

## Fluxo de Interação

```text
┌──────────────────────────────────────────────────────────────┐
│  1. Usuário clica no card da Cena 3                          │
│                         │                                    │
│                         ▼                                    │
│  2. setSelectedSceneIndex(2)                                 │
│                         │                                    │
│                         ▼                                    │
│  3. SceneDetailModal abre com shot = shots[2]                │
│                         │                                    │
│                         ▼                                    │
│  4. Usuário lê texto completo, vincula vídeo se quiser       │
│                         │                                    │
│                         ▼                                    │
│  5. Usuário clica → para próxima cena                        │
│     → setSelectedSceneIndex(3)                               │
│                         │                                    │
│                         ▼                                    │
│  6. Usuário fecha (X ou ESC ou clica fora)                   │
│     → setSelectedSceneIndex(null)                            │
└──────────────────────────────────────────────────────────────┘
```

## Mobile vs Desktop

| Aspecto | Mobile (Drawer) | Desktop (Dialog) |
|---------|-----------------|------------------|
| Abertura | Slide de baixo | Fade + zoom central |
| Altura | ~85vh com scroll | max-w-2xl, altura automática |
| Navegação | Swipe ou botões | Setas do teclado + botões |
| Fechamento | Swipe para baixo | Click fora ou ESC |

## Resultado Esperado

1. Cards da galeria continuam mostrando preview com 2 linhas
2. Ao clicar em qualquer card, abre visualização expandida
3. Editor pode ler o texto completo do roteiro da cena
4. Pode navegar entre cenas sem fechar o modal
5. Pode vincular vídeo diretamente no modal
6. Experiência adaptada para mobile (drawer) e desktop (dialog)
