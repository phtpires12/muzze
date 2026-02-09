
# Ideacao Adaptativa por Workflow

## Resumo

Adaptar os formularios de ideacao (IdeaForm, IdeaDetail, IdeaCard) para exibir campos diferentes conforme o workflow selecionado:

- **Minimalista (edits/montagens)**: Campo "Musica" obrigatorio + "Mensagem a ser passada" (renomeia "Ideia Central") obrigatoria
- **Classic e Freestyle**: Campo "Musica" aparece mas e opcional. "Ideia Central" permanece como esta

## O que muda por workflow

| Campo | Minimalista | Classic / Freestyle |
|-------|-------------|---------------------|
| Tipo de Conteudo | Obrigatorio | Obrigatorio |
| Ideia Central / Mensagem | Obrigatorio (label: "Mensagem a ser passada") | Obrigatorio (label: "Ideia Central") |
| Musica (link) | Obrigatorio | Opcional (visivel) |
| Titulo | Opcional | Opcional |
| Referencia | Opcional | Opcional |

## Dados

O campo `music_reference` (jsonb) ja existe na tabela `scripts`. Nenhuma migracao de banco de dados e necessaria.

## Arquivos a Modificar

### 1. `src/lib/workflow-templates.ts`
- Adicionar metadata ao template indicando campos da ideacao:
  - `ideationFields.musicRequired: boolean`
  - `ideationFields.centralIdeaLabel: string` (ex: "Mensagem a ser passada" vs "Ideia Central")

### 2. `src/components/brainstorm/IdeaDetail.tsx`
- Importar o workflow template efetivo do script
- Adicionar campo de musica (link simplificado: URL + nome da musica) abaixo da ideia central
- Marcar musica como obrigatoria quando `musicRequired === true`
- Trocar label de "Ideia Central" conforme o workflow
- Bloquear botao "Avancar" se musica obrigatoria e nao preenchida (no minimalist)

### 3. `src/components/brainstorm/IdeaCard.tsx`
- Adicionar campo de musica (Input simplificado para link) no card compacto do brainstorm
- O card usa o workflow global do perfil (ja que cards nao tem workflow individual atribuido ainda)
- Trocar placeholder da ideia central conforme workflow

### 4. `src/components/IdeaForm.tsx`
- Adicionar campo de musica (URL + nome)
- Trocar label/placeholder de "Ideia Central" conforme workflow
- Validacao: musica obrigatoria no minimalist
- Salvar `music_reference` no insert/update do script

## Detalhes Tecnicos

### Estrutura do campo musica nos formularios
Um campo simplificado (diferente do MusicPanel completo do EditingWorkspace):
- Input para URL da musica (Spotify, YouTube, etc)
- Input para nome da musica (opcional nos outros workflows)
- Auto-detecta tipo via URL (reutiliza `detectMusicType` do MusicPanel)

### Template metadata (workflow-templates.ts)
```typescript
// Adicionar ao WorkflowTemplate
ideationConfig: {
  centralIdeaLabel: string;  // "Ideia Central" ou "Mensagem a ser passada"
  musicRequired: boolean;
}
```

Valores:
- classic: `{ centralIdeaLabel: "Ideia Central", musicRequired: false }`
- freestyle: `{ centralIdeaLabel: "Ideia Central", musicRequired: false }`
- minimalist: `{ centralIdeaLabel: "Mensagem a ser passada", musicRequired: true }`

### Validacao de avanco
No IdeaDetail e IdeaForm, o botao de avancar so fica habilitado se:
- Tipo de conteudo preenchido
- Ideia central/mensagem preenchida (min 20 chars)
- Musica preenchida (apenas se `musicRequired === true`)

### Salvamento da musica
Reutiliza o formato `MusicReference` ja existente:
```typescript
{ url: string, name?: string, type: 'spotify' | 'youtube' | 'soundcloud' | 'other' }
```
Salvo em `scripts.music_reference` (jsonb).
