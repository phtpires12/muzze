## Plano: Auditoria e Correção do Sistema de Ofensiva

### ✅ IMPLEMENTADO

---

### Problema 1: Sessões Encerradas Automaticamente NÃO Atualizam Streak ✅

**Solução implementada:** Criada função `autoEndSession()` no SessionContext que:
1. Salva tempo da etapa atual
2. Consulta `stage_times` no banco para calcular minutos reais do dia
3. Verifica e atualiza streak se meta foi atingida
4. Calcula e salva XP com bônus de streak
5. Reseta o timer

---

### Problema 2: Encerramento Automático Não Verificava Streak ✅

**Solução implementada:** Todos os pontos de encerramento automático agora usam `autoEndSession()`:
- Inatividade por 15+ minutos sem interação
- Aba em background por 15+ minutos
- Sessão excede limite máximo de 4 horas

---

### Problema 3: Timeout de 30 Minutos Muito Longo ✅

**Constantes atualizadas:**
```typescript
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 min (era 30)
const MAX_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas máximo (NOVO)
```

---

### Novo Fluxo Implementado

```text
ENCERRAMENTO MANUAL (usuario clica "Finalizar"):
  endSession() → saveStageTime() → updateStreak(DB) → celebração → resetTimer()

ENCERRAMENTO AUTOMÁTICO (inatividade/timeout/limite 4h):
  autoEndSession() → saveStageTime() → queryDB(stage_times) → updateStreak(DB) → toast → resetTimer()
                                              ⬆
                            CONSULTA BANCO PARA MINUTOS REAIS DO DIA!
```

---

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/SessionContext.tsx` | + `autoEndSession()`, + `MAX_SESSION_DURATION_MS`, alterado `INACTIVITY_TIMEOUT_MS` para 15min, handlers atualizados |

---

### Próximos Passos Recomendados

1. **Testar o fluxo completo:** Iniciar sessão, trabalhar por tempo suficiente, e verificar se ofensiva é contabilizada corretamente
2. **Verificar cron `check-streaks`:** Confirmar se está rodando e se tem o secret `CRON_SECRET` configurado
