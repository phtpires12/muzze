

# Plano: Sistema Híbrido de Visualização - Galeria + Pastas (Atualizado)

## Resumo

Implementar visualização híbrida no `ShotlistPanel`:

1. **Com shot list**: Duas visualizações (Galeria ou Pastas) com classificação automática A-roll/B-roll
2. **Sem shot list**: Painel ultra-simplificado para vincular apenas o vídeo principal

---

## Nomenclatura Final

| Uso na UI |
|-----------|
| **A-roll** |
| **B-roll** |

Mantemos os termos originais conforme solicitado.

---

## Lógica de Classificação Automática

```typescript
function inferRollType(shot: ShotItem): 'a-roll' | 'b-roll' {
  const hasScene = shot.scene && shot.scene.trim().length > 0;
  const hasReferenceImages = shot.shotImagePaths && shot.shotImagePaths.length > 0;
  
  // Se tem descrição de cena OU imagem de referência = B-roll
  // Se está vazio = A-roll (só falando para câmera)
  return (hasScene || hasReferenceImages) ? 'b-roll' : 'a-roll';
}
```

---

## Cenário 1: Roteiro COM Shot List

### Visualização Galeria (aprimorada)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📹 Shotlist                                           [📑 Galeria] [📂 Pastas] │
│    12 cenas • 5 com vídeo                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Filtro:  [Todas]  [A-roll (5)]  [B-roll (7)]                                   │
│                                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  →                     │
│  │  Cena 1  │  │  Cena 2  │  │  Cena 3  │  │  Cena 4  │                        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Visualização Pastas (nova)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📹 Shotlist                                           [📑 Galeria] [📂 Pastas] │
│    12 cenas • 5 com vídeo                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  📂 A-roll                                                                 │ │
│  │     5 cenas • 3 com vídeo                                         [→]     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  📂 B-roll                                                                 │ │
│  │     7 cenas • 2 com vídeo                                         [→]     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Ao clicar em uma pasta, abre a galeria filtrada:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📂 B-roll                                                      [← Voltar]      │
│    7 cenas                                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  →                     │
│  │  Cena 2  │  │  Cena 4  │  │  Cena 6  │  │  Cena 8  │                        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cenário 2: Roteiro SEM Shot List (Simplificado)

Quando `shots.length === 0`, o painel mostra apenas:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📹 Arquivo de Vídeo                                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  🎬 Vídeo Principal                                                        │ │
│  │                                                                            │ │
│  │              [Vincular vídeo]                                              │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│           ou (se já vinculado):                                                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  🎬 Vídeo Principal                                                        │ │
│  │                                                                            │ │
│  │    ✅ Google Drive                                        [Abrir] [✕]     │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Lógica**: Se não criou shot list = não vai usar B-roll. Apenas um campo para o vídeo principal.

---

## Alterações Técnicas

### 1. Adicionar função de inferência

**Arquivo**: `src/lib/shotlist-generator.ts`

```typescript
export function inferRollType(shot: ShotItem): 'a-roll' | 'b-roll' {
  const hasScene = shot.scene && shot.scene.trim().length > 0;
  const hasReferenceImages = shot.shotImagePaths && shot.shotImagePaths.length > 0;
  return (hasScene || hasReferenceImages) ? 'b-roll' : 'a-roll';
}
```

### 2. Refatorar ShotlistPanel

**Arquivo**: `src/components/editing/ShotlistPanel.tsx`

- Adicionar estado `viewMode: 'gallery' | 'folders'`
- Adicionar estado `filter: 'all' | 'a-roll' | 'b-roll'`
- Adicionar toggle de visualização no header
- Adicionar filtro na galeria
- Renderizar `FolderView` ou `GalleryView` baseado no mode
- Quando `shots.length === 0`, renderizar `SimplifiedVideoPanel`

### 3. Criar componente FolderView

**Arquivo**: `src/components/editing/FolderView.tsx` (novo)

- Mostrar duas pastas (A-roll e B-roll)
- Contar cenas de cada tipo
- Ao clicar, mostrar galeria filtrada com botão "Voltar"

### 4. Criar componente SimplifiedVideoPanel

**Arquivo**: `src/components/editing/SimplifiedVideoPanel.tsx` (novo)

- Campo único para vincular vídeo principal
- Reutilizar lógica de detecção de tipo (Google Drive, Dropbox, YouTube)
- Interface mínima e limpa

### 5. Adicionar campo ao banco (opcional)

**Migração SQL** (se necessário para persistir o vídeo quando não há shot list):

```sql
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS main_video_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS main_video_type TEXT DEFAULT NULL;
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/lib/shotlist-generator.ts` | Adicionar `inferRollType()` |
| `src/components/editing/ShotlistPanel.tsx` | Refatorar para suportar views + filtros |
| `src/components/editing/FolderView.tsx` | **Criar** - Visualização de pastas |
| `src/components/editing/SimplifiedVideoPanel.tsx` | **Criar** - Painel para roteiros sem shot list |
| `src/pages/EditingWorkspace.tsx` | Passar props para `main_video_url` se existir |
| Migração SQL | Adicionar colunas `main_video_url` e `main_video_type` |

---

## Fluxo de Decisão

```text
                          ┌─────────────────┐
                          │  shots.length   │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                ▼ = 0                         ▼ > 0
     ┌──────────────────────┐     ┌────────────────────────────┐
     │ SimplifiedVideoPanel │     │  viewMode === 'gallery'?  │
     │ (só vídeo principal) │     └─────────────┬─────────────┘
     └──────────────────────┘                   │
                                     ┌──────────┴──────────┐
                                     │                     │
                                 ▼ sim                  ▼ não
                         ┌──────────────┐        ┌─────────────┐
                         │  GalleryView │        │  FolderView │
                         │  + filtros   │        │  (2 pastas) │
                         │  A-roll/B-roll│       └─────────────┘
                         └──────────────┘
```

---

## Ordem de Implementação

| # | Tarefa |
|---|--------|
| 1 | Adicionar função `inferRollType()` |
| 2 | Adicionar filtro A-roll/B-roll na galeria existente |
| 3 | Criar `FolderView` com navegação |
| 4 | Adicionar toggle Galeria/Pastas no header |
| 5 | Criar `SimplifiedVideoPanel` |
| 6 | Migração do banco para `main_video_url` |
| 7 | Integrar tudo no `EditingWorkspace` |

