
# Plano: Reformulação da Etapa de Edição - Mesa de Trabalho Criativa

## Visão Geral

Transformar a etapa de edição de um checklist com timer em uma **pasta de trabalho criativa** que agrega todos os insumos necessários para o editor executar seu trabalho no software de edição externo (CapCut, Premiere, DaVinci).

---

## Análise da Situação Atual

### O que existe hoje:
- `EditingChecklist.tsx`: Grid 2x2 com 6 etapas genéricas (Decupagem, Música, Efeitos Sonoros, etc.)
- Timer individual por etapa com play/pause
- Progresso salvo em `scripts.editing_progress` e `scripts.editing_times`
- Fluxo de conclusão: marcar todas as 6 etapas → status muda para "completed"

### Por que não funciona:
- Etapas não refletem o trabalho real de edição
- Falta de contexto criativo (não mostra shotlist, roteiro, etc.)
- Não agrega valor além de "marcar como feito"

---

## Nova Arquitetura: Editing Workspace

### Conceito
Uma página dedicada estilo "mesa de trabalho" com seções colapsáveis que reúnem todos os materiais necessários para editar.

### Componentes Principais

```text
┌─────────────────────────────────────────────────────────────────────┐
│  EDITING WORKSPACE                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 📋 SHOTLIST VISUAL                                              ││
│  │ - Todas as cenas em ordem                                       ││
│  │ - Imagens de referência visíveis                                ││
│  │ - Drag & drop para reorganizar sequência                        ││
│  │ - Filtros: por locação / por complexidade / cronológico         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🎬 ARQUIVOS DE VÍDEO (TAKES)                                    ││
│  │ - Links externos para os takes gravados                         ││
│  │ - Referências (Google Drive, Dropbox, etc.)                     ││
│  │ - Botões de abrir/baixar                                        ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🎵 MÚSICA                                                       ││
│  │ - Link para a música escolhida                                  ││
│  │ - Player embed (Spotify/YouTube) se disponível                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 📝 NOTAS DE EDIÇÃO                                              ││
│  │ - Campo de texto livre para anotações                           ││
│  │ - Ideias de efeitos, transições, etc.                           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ✅ CONCLUSÃO                                                    ││
│  │ - Botão único: "Marcar como Editado"                            ││
│  │ - Transição para pronto_para_postar                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Novos Campos no Banco de Dados

### Tabela `scripts` - Novos Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `video_references` | `jsonb` | Array de links externos para takes |
| `music_reference` | `jsonb` | Link e metadados da música escolhida |
| `editing_notes` | `text` | Notas livres para edição |
| `shot_complexity` | `jsonb` | Mapeamento de complexidade por shot |

### Estrutura do `video_references`
```json
[
  {
    "id": "uuid",
    "name": "Take 1 - Gancho",
    "url": "https://drive.google.com/...",
    "type": "google_drive",
    "addedAt": "2026-02-05T12:00:00Z"
  }
]
```

### Estrutura do `music_reference`
```json
{
  "url": "https://open.spotify.com/...",
  "name": "Nome da Música",
  "artist": "Artista",
  "type": "spotify"
}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Nova página principal da etapa de edição |
| `src/components/editing/ShotlistPanel.tsx` | Visualização da shotlist com filtros |
| `src/components/editing/VideoReferencesPanel.tsx` | Gerenciar links de takes |
| `src/components/editing/MusicPanel.tsx` | Referência de música |
| `src/components/editing/EditingNotesPanel.tsx` | Notas livres |
| `src/components/editing/CompleteEditingButton.tsx` | Botão de conclusão |

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Session.tsx` | Redirecionar para `/editing-workspace` quando stage=edit |
| `src/App.tsx` | Adicionar rota `/editing-workspace` |
| `src/hooks/useWorkflowTemplate.ts` | Atualizar URL helper para editing |
| Deletar: `src/components/EditingChecklist.tsx` | Substituído pelo novo workspace |

---

## Navegação e Integração

### Fluxo de Entrada
1. Usuário completa gravação → clica "Avançar para Edição"
2. Sistema navega para `/editing-workspace?scriptId=xxx`
3. Workspace carrega todos os dados do script

### Fluxo de Saída
1. Usuário clica "Marcar como Editado"
2. Sistema atualiza:
   - `status: 'completed'`
   - `publish_status: 'pronto_para_postar'`
3. Exibe celebração e navega para calendário

---

## Detalhes de Implementação

### 1. ShotlistPanel.tsx

```typescript
interface ShotlistPanelProps {
  shots: ShotItem[];
  onReorder: (shots: ShotItem[]) => void;
  filter: 'chronological' | 'location' | 'complexity';
  onFilterChange: (filter: string) => void;
}

// Features:
// - Drag & drop para reorganizar
// - Filtros por locação, complexidade, cronológico
// - Exibir imagens de referência em miniatura
// - Marcar cenas como "complexas" (priorizar na edição)
```

### 2. VideoReferencesPanel.tsx

```typescript
interface VideoReference {
  id: string;
  name: string;
  url: string;
  type: 'google_drive' | 'dropbox' | 'youtube' | 'other';
  addedAt: string;
}

// Features:
// - Adicionar novo link (input + botão)
// - Detectar automaticamente tipo pelo URL
// - Botões de abrir/copiar link
// - Remover link
```

### 3. MusicPanel.tsx

```typescript
interface MusicReference {
  url: string;
  name?: string;
  artist?: string;
  type: 'spotify' | 'youtube' | 'soundcloud' | 'other';
}

// Features:
// - Campo para colar link da música
// - Embed player para Spotify/YouTube
// - Campo para nome/artista manual
```

### 4. EditingNotesPanel.tsx

```typescript
// Features:
// - Rich text editor simples
// - Auto-save com debounce
// - Placeholder com sugestões:
//   "Ideias de transições, efeitos, cortes..."
```

### 5. CompleteEditingButton.tsx

```typescript
// Features:
// - Botão grande e claro: "Marcar como Editado"
// - Confirmação antes de marcar
// - Atualiza status e publish_status
// - Trigger de celebração
```

---

## Timer (Opcional)

O timer continua existindo como componente flutuante (`DraggableSessionTimer`), mas **não é obrigatório** para conclusão. O editor pode:
- Usar o timer se quiser trackear tempo
- Ignorar o timer e usar apenas a workspace
- Concluir a qualquer momento clicando no botão

---

## Migração de Dados

### Dados Existentes
- `editing_progress` e `editing_times` continuam existindo
- Novos campos (`video_references`, `music_reference`, `editing_notes`) iniciam vazios
- Scripts antigos funcionam normalmente

### Compatibilidade
- Não há breaking changes
- Novos campos são opcionais (nullable)

---

## UX e Visual

### Layout Mobile
- Seções colapsáveis (Accordion)
- Shotlist com cards horizontais scrolláveis
- Botão de conclusão fixo no bottom

### Layout Desktop
- Duas colunas: Shotlist (2/3) + Outros painéis (1/3)
- Shotlist expandida com mais detalhes
- Painéis laterais compactos

### Cores e Ícones
- Manter paleta existente do app
- Ícone principal: `Film` ou `Clapperboard`
- Seções com ícones distintos (📋 🎬 🎵 📝)

---

## Fases de Implementação

### Fase 1: Estrutura Base
1. Migração de banco (novos campos)
2. Criar `EditingWorkspace.tsx` com layout básico
3. Redirecionar `/session?stage=edit` para nova página
4. Botão de conclusão funcional

### Fase 2: Shotlist Panel
1. Carregar shotlist do script
2. Visualização em cards com imagens
3. Filtros básicos (sem drag & drop inicial)

### Fase 3: Referências
1. VideoReferencesPanel com CRUD de links
2. MusicPanel com campo de URL
3. Auto-save para banco

### Fase 4: Notas e Polish
1. EditingNotesPanel com rich text
2. Marcação de complexidade nas cenas
3. Drag & drop na shotlist

---

## Critérios de Aceite

- [ ] Nova página `/editing-workspace` funcionando
- [ ] Shotlist carregada e exibida visualmente
- [ ] Adicionar/remover links de vídeo (takes)
- [ ] Adicionar referência de música
- [ ] Campo de notas de edição com auto-save
- [ ] Botão "Marcar como Editado" atualiza status corretamente
- [ ] Timer flutuante opcional
- [ ] Funciona em mobile e desktop
- [ ] Migração não quebra scripts existentes

---

## Considerações Técnicas

### Storage
- Vídeos NÃO são armazenados na Muzze
- Apenas referências (URLs) são salvas no banco
- Bucket `shot-references` continua para imagens da shotlist

### Performance
- Lazy load de imagens da shotlist
- Debounce em todos os auto-saves
- Memoização dos componentes pesados

### Acessibilidade
- Seções colapsáveis com aria-expanded
- Botões com labels descritivos
- Contraste adequado em todos os estados
