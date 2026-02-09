
# Timer Inteligente: Início por Primeira Ação

## Contexto e Problema

Atualmente, quando o usuário inicia uma sessão criativa, o timer começa a contar imediatamente, mesmo que ele ainda não tenha começado a trabalhar de fato. Isso significa que o tempo registrado inclui:
- Tempo lendo o roteiro antes de editar
- Tempo decidindo o que escrever
- Distrações antes de começar

O resultado é que o **tempo cronometrado não reflete o tempo real de trabalho criativo**.

## Solução Proposta

Implementar um **modo de timer congelado** que aguarda a primeira ação do usuário antes de começar a contar. Duas abordagens foram consideradas:

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Detectar primeiro input** | Mede tempo real de trabalho | Complexo de implementar em todas as páginas |
| **Contagem regressiva de 3s** | Simples, visual claro | Adiciona atrito desnecessário |

**Recomendação**: Implementar a **Abordagem 1** (detectar primeiro input) com fallback para início automático em páginas sem input (ex: Edição).

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           SessionContext                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  TimerState                                                              │
│  ├── isActive: boolean                                                  │
│  ├── isPaused: boolean                                                  │
│  ├── isFrozen: boolean  ← NOVO: timer ativo mas não conta               │
│  ├── frozenSince: Date | null  ← NOVO: quando congelou                  │
│  └── ...                                                                 │
│                                                                          │
│  Funções                                                                 │
│  ├── startTimer(stage, frozen?: boolean)  ← MODIFICADO                  │
│  ├── unfreezeTimer()  ← NOVO: descongelar na primeira ação              │
│  └── ...                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    useFirstInputTrigger (novo hook)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Detecta primeira interação do usuário:                                  │
│  - keydown (digitação)                                                   │
│  - paste (colar texto)                                                   │
│  - input (mudança em campos)                                             │
│  - change (seleções, toggles)                                            │
│                                                                          │
│  Quando detecta → chama unfreezeTimer()                                  │
│  Auto-remove listeners após descongelar                                  │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              DraggableSessionTimer (modificado)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Quando isFrozen:                                                        │
│  - Mostra "00:00" ou "Pronto para começar"                              │
│  - Animação pulsante indicando espera                                    │
│  - Ícone de play/pausa diferenciado                                      │
│                                                                          │
│  Quando descongelar:                                                     │
│  - Transição suave para contagem normal                                  │
│  - Toast opcional: "Timer iniciado!"                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuração do Usuário

Nova preferência em `profiles`:

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `timer_start_mode` | `text` | `'auto'` | `'auto'` (inicia imediatamente) ou `'on_input'` (espera primeira ação) |

Essa configuração aparecerá na página de **Configurações** como:

```
Início do Timer
○ Automático (padrão) - Começa assim que você abre o conteúdo
○ Na primeira ação - Espera você começar a digitar ou interagir
```

## Páginas Afetadas

| Página | Tipo de Input | Comportamento |
|--------|---------------|---------------|
| **Session (Ideação)** | Título, descrição, referência | Espera input |
| **Session (Roteiro)** | Rich text editor (TipTap) | Espera input |
| **Session (Revisão)** | Rich text editor | Espera input |
| **ShotListRecord** | Checkboxes, notas | Espera input |
| **ShotListReview** | Similar ao Record | Espera input |
| **EditingWorkspace** | Links, checkboxes | **Início automático** (sem input contundente) |

## Implementação

### Fase 1: Banco de Dados
Adicionar coluna `timer_start_mode` na tabela `profiles` com default `'auto'`.

```sql
ALTER TABLE profiles 
ADD COLUMN timer_start_mode text DEFAULT 'auto';
```

### Fase 2: SessionContext
Modificar o estado do timer para suportar o modo "congelado":

- Adicionar `isFrozen` e `frozenSince` ao `TimerState`
- Modificar `startTimer` para aceitar parâmetro `frozen?: boolean`
- Criar função `unfreezeTimer()` que inicia a contagem real
- O interval de 1s só incrementa se `!isFrozen`

### Fase 3: Hook useFirstInputTrigger
Novo hook que:
1. Recebe `enabled: boolean` (baseado em `timer_start_mode === 'on_input'` e `timer.isFrozen`)
2. Adiciona listeners de input ao `document`
3. Chama `unfreezeTimer()` na primeira interação
4. Remove listeners após descongelar

### Fase 4: DraggableSessionTimer
Adicionar estado visual para timer congelado:
- Mostrar indicador visual de "aguardando"
- Animação sutil (pulso no ícone de play)
- Transição suave ao descongelar

### Fase 5: Páginas de Sessão
Integrar o hook em cada página:
- Session.tsx
- ShotListRecord.tsx
- ShotListReview.tsx
- ScriptEditor.tsx

### Fase 6: Settings
Adicionar toggle para preferência do usuário.

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useFirstInputTrigger.ts` | Hook para detectar primeira interação |

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/contexts/SessionContext.tsx` | Adicionar `isFrozen`, `frozenSince`, `unfreezeTimer()` |
| `src/components/DraggableSessionTimer.tsx` | UI para estado congelado |
| `src/pages/Session.tsx` | Integrar hook |
| `src/pages/ShotListRecord.tsx` | Integrar hook |
| `src/components/ScriptEditor.tsx` | Integrar hook |
| `src/pages/Settings.tsx` | Adicionar preferência |
| `src/hooks/useSession.ts` | Expor `unfreezeTimer` |

## Fluxo de Uso

1. Usuário ativa "Na primeira ação" nas Configurações
2. Abre um conteúdo para trabalhar (ex: roteiro)
3. Timer aparece mostrando "00:00" com animação pulsante
4. Usuário lê o roteiro, pensa...
5. Usuário começa a digitar
6. Timer detecta e começa a contar do zero
7. Toast sutil: "⏱️ Timer iniciado!"

## Considerações de UX

- **EditingWorkspace**: Mantém início automático (não há ação de input clara)
- **Timeout de segurança**: Se usuário não interagir em 30min, considera sessão abandonada
- **Som opcional**: Pode tocar som sutil ao descongelar (reutilizar `resume.mp3`)
- **Mobile**: Funciona igual, detecta touch/tap em inputs

## Estimativa de Complexidade

| Fase | Esforço |
|------|---------|
| Banco de dados | Baixo |
| SessionContext | Médio |
| Hook useFirstInputTrigger | Médio |
| DraggableSessionTimer | Baixo |
| Integração nas páginas | Médio |
| Settings | Baixo |
| **Total** | ~4-5 horas |
