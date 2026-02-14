

## Correcao: Calendario de Ofensiva mostrando menos dias do que o esperado

### Causa raiz identificada

A query de `fetchMonthProgress` na pagina Ofensiva esta retornando **exatamente 1000 registros** (limite padrao do banco de dados), mas o usuario tem **muito mais sessoes** no mes. Como cada sessao de trabalho gera dezenas de registros na tabela `stage_times` (registros curtos de 10-30 segundos), os 1000 registros cobrem apenas os primeiros 3 dias (4, 5, 6 de fevereiro), e os dias 7-14 ficam sem dados.

Evidencia dos logs do console:
- `Total sessoes encontradas: 1000` (limite atingido)
- Progresso do mes mostra apenas 3 dias: `2026-02-04`, `2026-02-05`, `2026-02-06`
- O dia 6 aparece com apenas 31 min quando deveria ter 346 min (dados cortados no meio)

### Solucao

Alterar a query em `fetchMonthProgress` no arquivo `src/pages/Ofensiva.tsx` para **agregar os dados no proprio banco** em vez de trazer todos os registros individuais para o frontend. Isso elimina o problema do limite de 1000 linhas.

### Detalhes tecnicos

**1. Criar uma funcao RPC no banco de dados**: `get_monthly_stage_summary`

Essa funcao recebe `user_id`, `start_utc` e `end_utc`, e retorna os minutos agrupados por dia ja no SQL:

```sql
CREATE OR REPLACE FUNCTION get_monthly_stage_summary(
  p_user_id uuid,
  p_start_utc timestamptz,
  p_end_utc timestamptz,
  p_timezone text DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE(day_key text, total_minutes numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(started_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') as day_key,
    SUM(duration_seconds) / 60.0 as total_minutes
  FROM stage_times
  WHERE user_id = p_user_id
    AND started_at >= p_start_utc
    AND started_at <= p_end_utc
    AND started_at IS NOT NULL
  GROUP BY day_key
  ORDER BY day_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Isso retorna no maximo 28-31 linhas (uma por dia do mes), eliminando completamente o problema de limite.

**2. Atualizar `fetchMonthProgress` em `src/pages/Ofensiva.tsx`**

Substituir a query direta na tabela `stage_times` pela chamada RPC:

```typescript
const { data: summary } = await supabase.rpc('get_monthly_stage_summary', {
  p_user_id: user.id,
  p_start_utc: monthStartUTC.toISOString(),
  p_end_utc: monthEndUTC.toISOString(),
  p_timezone: userTimezone,
});
```

E construir o `dayProgressMap` diretamente a partir do resultado.

**3. Resultado esperado**

Apos a correcao, o calendario vai mostrar corretamente:
- Dias 4, 5, 6: fogo completo (79, 149, 346 min)
- Dias 7-11: fogo completo (45, 50, 66, 31, 57 min - todos acima de 25 min)
- Dias 12-13: flocos de neve (freeze)
- Dia 14: hoje (em destaque)

Isso corresponde ao streak de 7 dias mostrado no contador.

