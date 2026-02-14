

## Correcao: Dupla contagem de bloqueios de ofensiva

### Causa raiz identificada

Existem **dois sistemas independentes** consumindo bloqueios para os mesmos dias:

1. **Cron job (`check-streaks`)**: roda diariamente as ~05:00 UTC, verifica o dia anterior e usa 1 freeze se necessario
2. **Frontend (`useStreakValidator`)**: roda quando o usuario abre o app, detecta dias perdidos e tambem usa freezes via `useFreezesToRecover` ou `buyFreezesAndRecover`

**Ambos inserem registros em `streak_freeze_usage` e ambos deduzem de `profiles.streak_freezes`, sem verificar se o outro ja cobriu aquele dia.**

### Evidencia nos dados

Para o usuario `12446de8`, fevereiro de 2026:

| Dia perdido | Freeze #1 (cron) | Freeze #2 (frontend) |
|---|---|---|
| Feb 12 | `used_at: 03:00 UTC` (criado 13/02 05:00) | `used_at: 12:00 UTC` (criado 14/02 15:11) |
| Feb 13 | `used_at: 03:00 UTC` (criado 14/02 05:00) | `used_at: 12:00 UTC` (criado 14/02 15:11) |

Resultado: **4 freezes consumidos para apenas 2 dias perdidos**. O usuario comprou 5, esperava ter 3 restantes (5 - 2 = 3), mas ficou com 1 (5 - 4 = 1).

### Solucao

Adicionar verificacao de idempotencia nas funcoes `useFreezesToRecover` e `buyFreezesAndRecover` dentro de `src/hooks/useStreakValidator.ts`. Antes de inserir um freeze para um dia, verificar se ja existe um registro em `streak_freeze_usage` para aquele dia (na timezone do usuario).

### Detalhes tecnicos

**Arquivo alterado: `src/hooks/useStreakValidator.ts`**

**1. Na funcao `useFreezesToRecover` (linha ~204):**

Antes do loop que insere freezes, para cada dia perdido:
- Consultar `streak_freeze_usage` para verificar se ja existe um registro com `used_at` dentro dos bounds UTC daquele dia
- Se ja existir, pular a insercao E nao contabilizar esse dia no total de freezes a descontar
- Descontar de `profiles.streak_freezes` apenas os freezes **realmente inseridos** (nao duplicados)

```typescript
// Antes de inserir cada freeze
let freezesActuallyUsed = 0;

for (let i = 1; i <= result.lostDaysCount; i++) {
  const freezeDate = new Date(lastEventDate);
  freezeDate.setDate(freezeDate.getDate() + i);
  const freezeDayKey = `${freezeDate.getFullYear()}-${String(freezeDate.getMonth() + 1).padStart(2, '0')}-${String(freezeDate.getDate()).padStart(2, '0')}`;
  
  // Verificar se ja existe freeze para esse dia
  const { startUTC, endUTC } = getDayBoundsUTC(freezeDayKey, timezone);
  const { data: existing } = await supabase
    .from('streak_freeze_usage')
    .select('id')
    .eq('user_id', user.id)
    .gte('used_at', startUTC.toISOString())
    .lte('used_at', endUTC.toISOString())
    .maybeSingle();

  if (!existing) {
    await supabase.from('streak_freeze_usage').insert({
      user_id: user.id,
      used_at: new Date(`${freezeDayKey}T12:00:00Z`).toISOString(),
    });
    freezesActuallyUsed++;
  }
}

// Descontar apenas os realmente usados
const newFreezeCount = (userProfile.streak_freezes || 0) - freezesActuallyUsed;
```

**2. Na funcao `buyFreezesAndRecover` (linha ~352):**

Aplicar a mesma logica de idempotencia:
- Verificar quais dias ja tem freeze antes de inserir
- Calcular `freezesToBuy` baseado apenas nos dias que realmente precisam de freeze
- Descontar XP apenas pelo numero correto de freezes comprados

**3. Importar `getDayBoundsUTC` no topo do arquivo:**

Adicionar import de `getDayBoundsUTC` de `@/lib/timezone-utils` (ja importa `getTodayKey`, `getYesterdayKey`, `diffDays`).

### Resultado esperado

- Se o cron ja usou freeze para um dia, o frontend **nao duplica**
- Se o frontend ja usou freeze para um dia, o cron **ja tem idempotencia** (verificacao existente no edge function)
- O usuario ve o numero correto de freezes restantes apos qualquer cenario

### Arquivos alterados

- `src/hooks/useStreakValidator.ts` -- adicionar verificacao de idempotencia em `useFreezesToRecover` e `buyFreezesAndRecover`

