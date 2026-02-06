
# Plano: Galeria Estilo Notion com Cards 16:9 e Vinculação de Vídeos

## Visão Geral

Transformar a `ShotlistPanel` atual (lista vertical) em uma galeria horizontal estilo Notion com cards 16:9, scroll horizontal com snap, e a capacidade de vincular arquivos de vídeo a cada cena individualmente.

## O Que Será Construído

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  📹 Shotlist Gallery                                        [12 cenas]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ◀ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────  ▶│
│    │   ┌─────────┐   │ │   ┌─────────┐   │ │   ┌─────────┐   │ │   ...      │
│    │   │  16:9   │   │ │   │  Imagem │   │ │   │Placeholder│  │ │           │
│    │   │Thumbnail│   │ │   │   Ref   │   │ │   │   Cinza  │  │ │           │
│    │   └─────────┘   │ │   └─────────┘   │ │   └─────────┘   │ │           │
│    │                 │ │                 │ │                 │ │           │
│    │ "2026 vai ser...│ │ "Você já tá...  │ │ "Oi eu sou o..." │ │           │
│    │                 │ │                 │ │                 │ │           │
│    │ [📍 Estúdio]    │ │ [📍 Externa]    │ │                 │ │           │
│    │                 │ │                 │ │                 │ │           │
│    │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │           │
│    │ │🎬 Vincular  │ │ │ │✅ Take 2    │ │ │ │🎬 Vincular  │ │ │           │
│    │ │   Vídeo     │ │ │ │  drive.com  │ │ │ │   Vídeo     │ │ │           │
│    │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │ │           │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘ └──────────  │
│                                                                              │
│     ○  ●  ○  ○  ○  ○  ○  ○  ○  ○  ○  ○   (12 dots de navegação)             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/editing/ShotlistPanel.tsx` | **Reescrever** | Nova galeria horizontal com cards 16:9 |
| `src/lib/shotlist-generator.ts` | Modificar | Adicionar campo `videoUrl` à interface |
| `src/pages/EditingWorkspace.tsx` | Modificar | Propagar `videoUrl` no mapeamento e salvar alterações |

## Detalhamento Técnico

### 1. Atualizar Interface ShotItem

```typescript
// src/lib/shotlist-generator.ts
export interface ShotItem {
  id: string;
  scriptSegment: string;
  scene: string;
  shotImagePaths: string[];
  shotImageUrls?: string[];   // DEPRECADO
  location: string;
  sectionName?: string;
  isCompleted?: boolean;
  videoUrl?: string;          // NOVO: Link do vídeo gravado (Drive/Dropbox/YouTube)
  videoType?: 'google_drive' | 'dropbox' | 'youtube' | 'other'; // NOVO
}
```

### 2. Nova Estrutura do ShotlistPanel

O componente será completamente reestruturado para:

- **Layout Horizontal**: Usar `overflow-x-auto` + `snap-x snap-mandatory`
- **Cards 16:9**: Cada card terá `aspect-video` para manter proporção
- **Largura Fixa**: Cards com `w-[280px] sm:w-[320px]` para garantir scroll
- **Thumbnail**: Exibir imagem de referência ou placeholder cinza
- **Texto Condensado**: Trecho do script com `line-clamp-2`
- **Badge de Locação**: Pequeno badge no canto do card
- **Botão de Vídeo**: Área para vincular/exibir link do vídeo gravado

### 3. Vinculação de Vídeo Inline

Cada card terá um botão/input para vincular vídeo:

```text
┌────────────────────────────────┐
│  Se NÃO tem vídeo:             │
│  ┌──────────────────────────┐  │
│  │ 🎬 + Vincular Vídeo      │  │
│  │  (abre modal/input)      │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  Se TEM vídeo:                 │
│  ┌──────────────────────────┐  │
│  │ ✅ Take 1              🔗│  │
│  │    drive.google.com      │  │
│  │              [x remover] │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### 4. Salvar videoUrl no Banco

O `shot_list` já é um JSONB array no banco. Apenas adicionaremos o campo `videoUrl` aos objetos existentes. Não precisa de migração SQL.

Fluxo:
1. Usuário cola link no card
2. Sistema detecta tipo (Drive, Dropbox, YouTube)
3. Atualiza o objeto no array `shot_list`
4. Salva todo o array atualizado via Supabase

### 5. Componentes UI Utilizados

- **embla-carousel-react**: Já instalado, usado para scroll horizontal suave
- **AspectRatio**: Componente Radix já disponível para 16:9
- **ScrollArea**: Alternativa se preferir scroll nativo

## Fluxo de Dados

```text
                    ┌─────────────────────────────────────────┐
                    │           shot_list (JSONB)             │
                    │  [{id, scriptSegment, videoUrl, ...}]   │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
              ┌───────────────────────────────────────────────┐
              │           EditingWorkspace.tsx                │
              │  - Carrega shot_list do banco                 │
              │  - Mapeia para ShotItem[] com videoUrl        │
              │  - Passa handleUpdateShot para ShotlistPanel  │
              └───────────────────────┬───────────────────────┘
                                      │
                                      ▼
              ┌───────────────────────────────────────────────┐
              │           ShotlistPanel.tsx                   │
              │  - Renderiza galeria horizontal               │
              │  - Cada card exibe: thumbnail, texto, vídeo   │
              │  - onVideoLink → atualiza shot e salva        │
              └───────────────────────────────────────────────┘
```

## O Que Vai Mudar Visualmente

| Antes | Depois |
|-------|--------|
| Lista vertical simples | Galeria horizontal com scroll |
| Cards pequenos lado a lado | Cards grandes 16:9 com snap |
| Sem vídeo vinculado | Cada cena pode ter seu vídeo |
| Filtros complexos | Interface limpa focada em visualização |

## Resultado Esperado

1. A Mesa de Edição exibirá uma galeria horizontal bonita estilo Notion
2. Cada cena aparece como um card 16:9 com thumbnail (imagem ou placeholder)
3. O texto do roteiro aparece condensado abaixo da thumbnail
4. Badges de locação aparecem quando definidos
5. Botão para vincular vídeo permite associar links do Google Drive, Dropbox ou YouTube
6. Ao vincular, o botão muda para exibir o link e permitir abrir/remover
7. Scroll horizontal suave com snap para navegar entre cenas
8. Indicadores de posição (dots) mostram qual cena está ativa
