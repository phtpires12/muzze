

## Plano: Auditoria e Correção do Sistema de Ofensiva

### Problemas Identificados

Após análise completa do código, identifiquei **3 problemas críticos** que explicam por que a ofensiva não está sendo contabilizada:

---

### Problema 1: Sessões Encerradas Automaticamente NÃO Atualizam Streak

**Onde:** `src/contexts/SessionContext.tsx` (linhas 311-319 e 373-387)

Quando o usuário fica inativo por 30+ minutos:
- O sistema salva o tempo (`saveStageTimeRef.current()`) 
- Reseta o timer (`setTimer(defaultTimerState)`)
- **MAS NÃO CHAMA `updateStreak()`**

Resultado: O tempo é gravado no banco, mas o streak nunca é verificado/atualizado.

```text
FLUXO ATUAL (PROBLEMA):
  Inatividade 30min → saveStageTime() → resetTimer() → FIM
                                                       ⬆ NÃO VERIFICA STREAK!

FLUXO ESPERADO:
  Inatividade 30min → saveStageTime() → updateStreak() → resetTimer() → FIM
```

---

### Problema 2: Encerramento Manual Depende de Timer Local (Não do Banco)

**Onde:** `src/hooks/useSession.ts` (linhas 84-188)

O `endSession()` calcula XP e minutos baseados em `timer.elapsedSeconds`, que pode estar zerado ou incorreto se:
- O app foi recarregado durante a sessão
- O timer foi pausado/retomado várias vezes
- Houve problemas de sincronização

Embora a função `updateStreak()` faça query ao banco para verificar minutos reais, ela recebe `totalMinutes` do timer local como parâmetro (que pode estar errado).

---

### Problema 3: Timeout de 30 Minutos é Muito Longo

**Onde:** `src/contexts/SessionContext.tsx` (linha 59)

```typescript
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
```

O usuário pode esquecer a sessão aberta por horas. Com timeout de 30 minutos, o tempo continua sendo contado mesmo quando o usuário está fazendo outras coisas (não criando conteúdo).

---

### Solução Proposta

#### Parte 1: Criar Função `autoEndSession()` que Atualiza Streak

Nova função no SessionContext que:
1. Salva o tempo restante da etapa atual
2. Calcula os minutos do dia DIRETAMENTE do banco (não do timer local)
3. Chama `updateStreak()` se o usuário atingiu a meta
4. Reseta o timer

#### Parte 2: Chamar `autoEndSession()` em Todos os Pontos de Encerramento Automático

Atualizar:
- Encerramento por inatividade (30 min sem interação)
- Encerramento por background (30 min em outra aba)

#### Parte 3: Reduzir Timeout de Inatividade

Proposta: Reduzir de 30 para 10-15 minutos. Isso evita que sessões esquecidas acumulem tempo fantasma.

| Constante | Valor Atual | Valor Proposto |
|-----------|-------------|----------------|
| `INACTIVITY_TIMEOUT_MS` | 30 min | 15 min |
| `BACKGROUND_PAUSE_MS` | 2 min | 2 min (manter) |

#### Parte 4: Adicionar Timeout Máximo Absoluto de Sessão

Nova proteção: Uma sessão não pode durar mais de **4 horas** corridas. Após esse período, é encerrada automaticamente com salvamento de streak.

```typescript
const MAX_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas máximo
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/SessionContext.tsx` | Criar `autoEndSession()`, atualizar handlers de inatividade, adicionar timeout máximo |
| `src/hooks/useSession.ts` | Expor `autoEndSession()` no hook |

---

### Diagrama do Novo Fluxo

```text
ENCERRAMENTO MANUAL (usuario clica "Finalizar"):
  endSession() → saveStageTime() → updateStreak(DB) → celebração → resetTimer()

ENCERRAMENTO AUTOMÁTICO (inatividade/timeout):
  autoEndSession() → saveStageTime() → updateStreak(DB) → toast → resetTimer()
                                              ⬆
                            MESMO FLUXO DE VERIFICAÇÃO DE STREAK!
```

---

### Verificações Adicionais Recomendadas

1. **Confirmar que o cron `check-streaks` está rodando:** Os logs estão vazios, o que pode indicar que não está sendo executado.

2. **Verificar secret `CRON_SECRET`:** Necessário para o cron job funcionar.

---

### Seção Técnica

**Por que o tempo está sendo gravado mas o streak não?**

O sistema atual tem dois caminhos de encerramento:

1. **Manual (`endSession()`):** Salva tempo → calcula XP → atualiza streak → celebração
2. **Automático (inatividade):** Salva tempo → reseta timer (STREAK IGNORADO)

O caminho automático "esquece" de verificar se o usuário atingiu a meta do dia.

**Por que usar dados do banco e não do timer local?**

O timer local pode ser resetado por:
- Refresh da página
- Fechar e reabrir o app
- Política de "nunca restaurar sessões órfãs" (linha 99-109)

Os dados em `stage_times` são a fonte de verdade. A função `updateStreak()` já faz essa verificação internamente, mas só é chamada no encerramento manual.

**Constantes de timeout propostas:**

```typescript
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 min (era 30)
const MAX_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas máximo
```

