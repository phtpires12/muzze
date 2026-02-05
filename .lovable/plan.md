
# Plano: Redesign da Shotlist para Galeria Horizontal (Estilo Notion)

## Visão Geral

Transformar a shotlist de uma lista vertical para uma **galeria horizontal com scroll lateral**, onde cada cena é um card visual com thumbnail no topo e informações condensadas abaixo.

---

## Estrutura Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [📋] Shotlist                                                          │
│       12 cenas                                                    [▼]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  [IMAGEM]    │  │  [IMAGEM]    │  │              │  │             │  │
│  │              │  │              │  │  (placeholder)│  │             │  │
│  │              │  │              │  │              │  │             │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├─────────────┤  │
│  │ GANCHO       │  │ SETUP        │  │ 3            │  │ 4           │  │
│  │ 1  Texto...  │  │ 2  Texto...  │  │ Texto...     │  │ Texto...    │  │
│  │ 📍 Locação   │  │              │  │              │  │ 📍 Estúdio  │  │
│  │ 🎬 Add vídeo │  │ 🎬 Add vídeo │  │ 🎬 Add vídeo │  │ 🎬 Abrir ▸  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                    ──▸  │
│                        (scroll horizontal)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Mudanças Principais

### 1. Atualizar Interface `ShotItem`

Adicionar campos que faltam para suportar a galeria:

```typescript
export interface ShotItem {
  id: string;
  description: string;      // scriptSegment (trecho do roteiro)
  scene?: string;           // descrição técnica da cena
  imageUrl?: string;        // thumbnail de referência
  location?: string;        // locação
  sectionName?: string;     // seção (Gancho, Setup, etc.)
  videoUrl?: string;        // link do take
  isCompleted?: boolean;
  order: number;
}
```

### 2. Layout da Galeria Horizontal

Substituir a lista vertical por um container com scroll horizontal:

```tsx
<ScrollArea className="w-full" orientation="horizontal">
  <div className="flex gap-4 pb-4">
    {filteredShots.map((shot, index) => (
      <ShotGalleryCard key={shot.id} shot={shot} index={index} />
    ))}
  </div>
</ScrollArea>
```

### 3. Design do Card de Galeria

Cada card terá:

| Elemento | Descrição |
|----------|-----------|
| **Thumbnail** | Aspect ratio 16:9, imagem de referência ou placeholder cinza |
| **Seção** | Badge colorido (ex: "GANCHO" em roxo) - se existir |
| **Número + Texto** | Índice e trecho do roteiro (2-3 linhas) |
| **Descrição** | Descrição técnica da cena - se preenchida |
| **Locação** | Badge com ícone MapPin - se preenchida |
| **Botão Vídeo** | "Adicionar vídeo" ou "Abrir ▸" com ícone do serviço |

### 4. Dimensões do Card

- **Largura fixa**: `w-72` (288px) no desktop, `w-64` (256px) no mobile
- **Altura da thumbnail**: `aspect-video` (16:9)
- **Altura total**: Auto, baseada no conteúdo

### 5. Placeholder para Imagens Ausentes

Card sem imagem mostra um placeholder visual discreto:

```tsx
<div className="aspect-video bg-muted/30 border border-dashed border-border rounded-lg" />
```

### 6. Remover Elementos Obsoletos

- Remover filtros "Ordem", "Locação", "Complexas" (não fazem sentido na galeria)
- Remover botão de estrelinha (complexidade)
- Manter apenas o header com título + contagem

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/editing/ShotlistPanel.tsx` | Reescrever para layout de galeria horizontal com cards |
| `src/pages/EditingWorkspace.tsx` | Mapear campo `scene` do shot_list |

---

## Detalhes Técnicos

### Scroll Horizontal

Usar `ScrollArea` do Radix UI com orientação horizontal:

```tsx
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

<ScrollArea className="w-full whitespace-nowrap">
  <div className="flex gap-4">
    {/* cards */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

### Responsividade

- **Desktop**: Cards `w-72`, scroll horizontal livre
- **Mobile**: Cards `w-64`, galeria ocupa 100% da largura

### Estado do Vídeo

O botão muda baseado no `videoUrl`:
- **Sem vídeo**: "Adicionar vídeo" (input aparece ao clicar)
- **Com vídeo**: Ícone do serviço + "Abrir" (abre em nova aba)

---

## Resultado Esperado

**Antes:**
- Lista vertical dentro de card colapsível
- Botões de filtro que não agregam valor
- Espaço desperdiçado na tela

**Depois:**
- Galeria horizontal estilo Notion
- Thumbnails visuais destacadas
- Informações condensadas por cena
- Uso eficiente do espaço da tela

---

## Critérios de Aceite

- [ ] Galeria exibe cards lado a lado com scroll horizontal
- [ ] Thumbnail (ou placeholder) aparece no topo de cada card
- [ ] Seção (Gancho, Setup) aparece como badge colorido
- [ ] Trecho do roteiro é exibido com 2-3 linhas máximo
- [ ] Locação aparece apenas quando preenchida
- [ ] Botão "Adicionar vídeo" funciona e persiste no banco
- [ ] Layout responsivo funciona no mobile
