

# Plano: Vincular Arquivos de Vídeo a Cada Cena (Problema 3)

## Problema Atual

Existe um painel global "Arquivos de Vídeo" (`VideoReferencesPanel`) que funciona como um pool de links:
- Todos os vídeos ficam misturados em uma lista
- Não há conexão entre um vídeo e a cena correspondente
- O usuário perde a organização visual entre cena → take gravado

**O ideal:** Cada cena da shotlist deve ter seu próprio espaço para adicionar o link do arquivo de vídeo correspondente.

---

## Solução

### 1. Adicionar campo `videoUrl` à interface `ShotItem`

```typescript
export interface ShotItem {
  id: string;
  description: string;
  imageUrl?: string;
  location?: string;
  isComplex?: boolean;
  isCompleted?: boolean;
  sectionName?: string;
  videoUrl?: string;  // ← Novo campo para o link do take
  order: number;
}
```

### 2. Modificar cada card de cena no `ShotlistPanel`

Adicionar dentro de cada cena:
- Input compacto para colar link do vídeo (Google Drive, Dropbox, etc.)
- Ícone indicando o tipo de serviço (Drive, Dropbox, YouTube)
- Botões para abrir link e remover

**UI por cena:**
```
┌─────────────────────────────────────────────────┐
│ 1  │ Texto do roteiro aqui...                   │
│    │                                             │
│    │ 🎬 Colar link do vídeo...  [Abrir] [🗑️]   │
└─────────────────────────────────────────────────┘
```

### 3. Remover o painel global `VideoReferencesPanel`

Como cada cena terá seu próprio espaço, o painel global se torna redundante.

### 4. Atualizar o mapeamento em `EditingWorkspace.tsx`

Mapear o campo `videoUrl` do shot_list armazenado no banco:
```typescript
videoUrl: shotData.videoUrl || undefined,
```

### 5. Propagar alterações para o banco

Quando o usuário adicionar/remover um link de vídeo:
1. Atualizar o estado local
2. Chamar `onShotsChange` para persistir no banco

---

## Mudanças de Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/editing/ShotlistPanel.tsx` | Adicionar input de vídeo em cada cena + lógica de update |
| `src/pages/EditingWorkspace.tsx` | Mapear `videoUrl`, remover `VideoReferencesPanel`, atualizar `onShotsChange` |

---

## Visual Final

**Antes:**
- Painel global separado com lista de vídeos

**Depois:**
- Cada cena da shotlist tem um campo inline para seu vídeo
- Ícone do serviço (Drive, Dropbox) aparece quando há link
- Botões de ação (abrir, copiar, remover) ao lado

---

## Critérios de Aceite

- [ ] Cada cena exibe um campo para adicionar link de vídeo
- [ ] Painel global "Arquivos de Vídeo" é removido
- [ ] Links adicionados são persistidos no banco por cena
- [ ] Ícone indica o tipo de serviço (Drive, Dropbox, YouTube)
- [ ] Botão "Abrir" abre o link em nova aba

