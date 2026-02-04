
## Plano: Timer Expandido (Modo Fullscreen)

### Resumo da Feature

Adicionar um botao de expansao ao `DraggableSessionTimer` que permite ao usuario visualizar o timer em tela cheia. Ideal para gravar videos mostrando o tempo de criacao de conteudo ou para visualizacao focada durante sessoes longas.

---

### Localizacao do Botao

Conforme sua sugestao na imagem, o botao ficara no header do timer (barra de arraste), entre o nome da etapa e o icone de arrastar:

```text
┌─────────────────────────────────────────────────┐
│  Edicao          [⛶]  ⋮⋮                        │  ← Botao de expandir aqui
├─────────────────────────────────────────────────┤
│  [icon]  1:19                    [⏸] [■]       │
│          Falta: 21:29                          │
│  ═══════════════════════                       │
└─────────────────────────────────────────────────┘
```

---

### Visual do Modo Expandido

Quando expandido, o timer ocupara toda a tela com visual otimizado para video:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                   [✕]       │
│                                                             │
│                                                             │
│                         [🔥]                                │
│                                                             │
│                       12:34                                 │
│                  Falta: 12:26                               │
│                                                             │
│              ━━━━━━━━━━━━━━━━━━━━━━━                        │
│                                                             │
│                   [⏸ Pausar]  [■ Finalizar]                │
│                                                             │
│                        Edicao                               │
└─────────────────────────────────────────────────────────────┘
```

**Caracteristicas:**
- Fundo escuro com blur (`bg-background/95 backdrop-blur-xl`)
- Timer em tamanho grande (fonte 6xl-8xl)
- Icone da etapa ampliado (96x96px)
- Botoes de controle maiores e com labels
- Barra de progresso mais grossa e visivel
- Botao de fechar (X) no canto superior direito
- Mantém os modos visuais (normal, ofensiva, bonus)

---

### Comportamento

| Acao | Resultado |
|------|-----------|
| Clicar no botao de expandir | Timer vai para fullscreen |
| Clicar no X ou pressionar ESC | Sai do fullscreen |
| Pausar/Retomar | Funciona normalmente no fullscreen |
| Finalizar sessao | Modal de confirmacao, depois fecha fullscreen |
| Timer atinge modo ofensiva | Visual muda com animacoes (mesmo no fullscreen) |

---

### Persistencia

O estado expandido NAO sera persistido (sempre inicia minimizado). Isso porque:
- E uma visualizacao temporaria para videos/focus
- O usuario pode esquecer que estava expandido
- Evita confusao ao reabrir o app

---

### Implementacao Tecnica

**Novo estado no componente:**
```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

**Novo import:**
```typescript
import { Maximize2, Minimize2, X } from 'lucide-react';
```

**Estrutura do JSX:**
```typescript
// Se expandido, renderizar fullscreen
if (isExpanded) {
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex items-center justify-center">
      {/* Botao fechar */}
      <Button 
        className="absolute top-4 right-4" 
        onClick={() => setIsExpanded(false)}
      >
        <X />
      </Button>
      
      {/* Conteudo expandido */}
      <div className="text-center space-y-8">
        {/* Icone grande */}
        {/* Timer grande */}
        {/* Meta/Bonus */}
        {/* Barra de progresso */}
        {/* Controles */}
        {/* Nome da etapa */}
      </div>
    </div>
  );
}

// Senao, renderizar normal (draggable)
return (
  <div className="fixed z-50" style={{...}}>
    {/* Header com novo botao */}
    <div className="flex items-center justify-between">
      <span>{stage}</span>
      <div className="flex items-center gap-1">
        <Button onClick={() => setIsExpanded(true)}>
          <Maximize2 />
        </Button>
        <GripVertical />
      </div>
    </div>
    {/* ... resto do timer */}
  </div>
);
```

**Atalho de teclado (ESC para fechar):**
```typescript
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [isExpanded]);
```

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/DraggableSessionTimer.tsx` | Adicionar estado `isExpanded`, botao de expandir, e renderizacao fullscreen |

---

### Adaptacao Mobile vs Desktop

| Aspecto | Mobile | Desktop |
|---------|--------|---------|
| Tamanho do timer expandido | 5xl | 8xl |
| Icone | 80px | 96px |
| Botoes | Com labels curtos | Com labels completos |
| Gesto para fechar | Tap no X | X ou ESC |

---

### Animacoes

Usar `framer-motion` para transicao suave:
- **Expandir:** `scale-in` + `fade-in` (200ms)
- **Fechar:** `scale-out` + `fade-out` (200ms)

O projeto ja usa framer-motion, entao aproveitamos os patterns existentes.

---

### Ordem de Implementacao

1. Adicionar estado `isExpanded` e imports de icones
2. Adicionar botao de expandir no header (entre stage e GripVertical)
3. Criar renderizacao condicional para modo expandido
4. Implementar listener ESC para fechar
5. Adicionar animacoes com framer-motion
6. Testar em todas as paginas onde o timer aparece (Session, ShotListRecord, ShotListReview)
