

## Plano: Eliminar Telas Fantasmas do Onboarding

### Problema Identificado

Após a exclusão dos arquivos de componentes, o sistema ainda navega para telas que não existem porque:

1. **SCREENS_PER_PHASE** ainda conta com essas telas: `[10, 8, 5, 5, 2, 6]`
2. **renderScreen()** retorna `null` para índices 3-7 da Phase 1 e índices 0-3 da Phase 2
3. **showContinueButton** exibe botões para essas telas vazias
4. O **OnboardingLayout** envolve essas telas vazias e exibe "Fase X, Tela Y"

---

### Estrutura Atual do Fluxo

| Phase | Telas Atuais | Telas Reais (Implementadas) |
|-------|-------------|----------------------------|
| 0 | 10 | 10 (Welcome, HowWeHelp, StartQuestionnaire, Username, ContentGoal, StickingPoints, Diferencial, MonthsTrying, Constancia, ClusterFeedback) |
| 1 | 8 | **3** (BehavioralScience, DailyTime, CreationTime) - 5 são fantasmas |
| 2 | 5 | **1** (Screen13DreamOutcome no índice 4) - 4 são fantasmas |
| 3 | 5 | **4** (Screen15MinimalEffort, Screen16PersonalizedFeatures, Screen17UniquePositioning, Screen18CommitmentTest) - 1 é fantasma |
| 4 | 2 | 2 (Screen19DailyGoal, Screen20CreationTime) |
| 5 | 6 | 6 (Signup, Snapshot, Notifications, Review, Paywall, Install) |

---

### Solução: Reorganizar o Fluxo

Vamos reorganizar para que Phase 1 termine em CreationTime e pule direto para as telas reais:

**Nova estrutura proposta:**

```typescript
SCREENS_PER_PHASE = [10, 3, 1, 4, 2, 6];
// Phase 0: 10 telas (completas)
// Phase 1: 3 telas (BehavioralScience, DailyTime, CreationTime)
// Phase 2: 1 tela (DreamOutcome - era índice 4, agora índice 0)
// Phase 3: 4 telas (MinimalEffort, PersonalizedFeatures, UniquePositioning, CommitmentTest)
// Phase 4: 2 telas (DailyGoal, CreationTime)
// Phase 5: 6 telas (Signup, Snapshot, Notifications, Review, Paywall, Install)
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/onboarding.ts` | Atualizar SCREENS_PER_PHASE para `[10, 3, 1, 4, 2, 6]` |
| `src/pages/NewOnboarding.tsx` | Remover placeholders null, reorganizar índices, atualizar canContinue e showContinueButton |

---

### Mudanças Detalhadas em NewOnboarding.tsx

**1. Remover placeholders de renderScreen():**
- Phase 1: Remover linhas 250-254 (placeholders para screens 3-7)
- Phase 2: Remover linhas 259-262 (placeholders para screens 0-3), mover DreamOutcome para screen 0
- Phase 3: Remover placeholder para screen 0, ajustar índices (MinimalEffort vira 0, etc.)

**2. Atualizar canContinue():**
- Phase 1: Remover validações para screens 3-7
- Phase 2: DreamOutcome passa a ser screen 0
- Phase 3: Ajustar índices (MinimalEffort = 0, PersonalizedFeatures = 1, etc.)

**3. Atualizar showContinueButton:**
```typescript
const showContinueButton =
  (state.phase === 2 && state.screen === 0) || // DreamOutcome
  (state.phase === 3 && state.screen >= 0 && state.screen <= 3) || // Phase 3
  (state.phase === 4 && state.screen === 1) || // CreationTime
  (state.phase === 5 && state.screen === 1); // Snapshot
```

---

### Mapeamento de Índices Antigos para Novos

**Phase 1:**
| Antigo | Novo | Tela |
|--------|------|------|
| 0 | 0 | BehavioralScience |
| 1 | 1 | DailyTime |
| 2 | 2 | CreationTime |
| 3-7 | ❌ | Removidos |

**Phase 2:**
| Antigo | Novo | Tela |
|--------|------|------|
| 0-3 | ❌ | Removidos |
| 4 | 0 | DreamOutcome |

**Phase 3:**
| Antigo | Novo | Tela |
|--------|------|------|
| 0 | ❌ | Removido |
| 1 | 0 | MinimalEffort |
| 2 | 1 | PersonalizedFeatures |
| 3 | 2 | UniquePositioning |
| 4 | 3 | CommitmentTest |

**Phase 4 e 5:** Sem mudanças

---

### Seção Técnica

**Por que essa abordagem?**
- Elimina completamente as telas fantasmas
- Mantém o fluxo navegável sem telas vazias
- Não requer criar novas telas imediatamente
- Permite adicionar telas novas no futuro nos lugares corretos

**Risco:**
- O progresso salvo de usuários em onboarding pode ficar inconsistente se eles estavam em telas que foram removidas
- Solução: O hook `useOnboarding` já valida e ajusta phase/screen para valores válidos no carregamento

**Ordem de execução:**
1. Atualizar `SCREENS_PER_PHASE` em `src/types/onboarding.ts`
2. Reorganizar `renderScreen()` em `NewOnboarding.tsx`
3. Atualizar `canContinue()` com novos índices
4. Atualizar `showContinueButton` com novos índices

