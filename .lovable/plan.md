
## Plano: Excluir Telas Antigas do Onboarding (Batch 2)

### Objetivo

Excluir completamente 10 telas antigas do onboarding identificadas nos prints, removendo tanto os arquivos de componentes quanto todas as referencias no NewOnboarding.tsx para evitar telas fantasmas ou codigo morto.

---

### Telas a Excluir (Mapeamento dos Prints)

| # | Titulo da Tela | Arquivo |
|---|----------------|---------|
| 1 | "O quanto isso importa pra voce?" | `phase3/Screen13DreamOutcome.tsx` |
| 2 | "25 minutos e menos do que parece" | `phase4/Screen15MinimalEffort.tsx` |
| 3 | "A Muzze foi feita pra voce" | `phase4/Screen16PersonalizedFeatures.tsx` |
| 4 | "O primeiro app pensado pra voce" | `phase4/Screen17UniquePositioning.tsx` |
| 5 | "Uma ultima pergunta importante" | `phase4/Screen18CommitmentTest.tsx` |
| 6 | "Vamos confirmar seu compromisso?" | `phase5/Screen19DailyGoal.tsx` |
| 7 | "Qual seu melhor horario pra criar?" | `phase5/Screen20CreationTime.tsx` |
| 8 | "Seu diagnostico personalizado" | `phase6/Screen22Snapshot.tsx` |
| 9 | "Vamos te lembrar de criar?" | `phase6/Screen23Notifications.tsx` |
| 10 | "Gostando da experiencia ate aqui?" | `phase6/Screen24Review.tsx` |

---

### Tela que Permanece (Conforme Instrucoes)

| Tela | Arquivo | Status |
|------|---------|--------|
| Signup/Login | `phase6/Screen21Signup.tsx` | Manter |
| Paywall | `phase6/Screen25Paywall.tsx` | Manter |
| Install | `phase6/Screen26Install.tsx` | Manter |

---

### Arquivos a Excluir

**Phase 3 (1 arquivo):**
```
src/components/onboarding/screens/phase3/Screen13DreamOutcome.tsx
```

**Phase 4 (4 arquivos):**
```
src/components/onboarding/screens/phase4/Screen15MinimalEffort.tsx
src/components/onboarding/screens/phase4/Screen16PersonalizedFeatures.tsx
src/components/onboarding/screens/phase4/Screen17UniquePositioning.tsx
src/components/onboarding/screens/phase4/Screen18CommitmentTest.tsx
```

**Phase 5 (2 arquivos):**
```
src/components/onboarding/screens/phase5/Screen19DailyGoal.tsx
src/components/onboarding/screens/phase5/Screen20CreationTime.tsx
```

**Phase 6 (3 arquivos):**
```
src/components/onboarding/screens/phase6/Screen22Snapshot.tsx
src/components/onboarding/screens/phase6/Screen23Notifications.tsx
src/components/onboarding/screens/phase6/Screen24Review.tsx
```

---

### Componentes Compartilhados a Excluir

Com a remocao de Screen13DreamOutcome e Screen22Snapshot, os seguintes componentes compartilhados ficam orfaos:

```
src/components/onboarding/shared/ScaleSelector.tsx (usado por Screen13DreamOutcome)
src/components/onboarding/shared/DiagnosisSnapshot.tsx (usado por Screen22Snapshot)
```

---

### Atualizacao de NewOnboarding.tsx

**1. Remover imports (linhas 27-37):**
- Screen13DreamOutcome
- Screen15MinimalEffort
- Screen16PersonalizedFeatures
- Screen17UniquePositioning
- Screen18CommitmentTest
- Screen19DailyGoal
- Screen20CreationTime
- Screen22Snapshot
- Screen23Notifications
- Screen24Review

**2. Atualizar renderScreen():**
- Phase 2: Remover Screen13DreamOutcome (linhas 237-252)
- Phase 3: Remover telas 0-3 (linhas 254-273)
- Phase 4: Remover telas 0-1 (linhas 275-294)
- Phase 5: Remover telas 1-3 (Screen22Snapshot, Screen23Notifications, Screen24Review) (linhas 306-319)

**3. Atualizar canContinue():**
- Phase 2: Remover validacao de DreamOutcome (linhas 164-173)
- Phase 3: Remover validacoes de todas as 4 telas (linhas 175-181)
- Phase 4: Remover validacoes de DailyGoal e CreationTime (linhas 183-187)
- Phase 5: Remover validacoes de Snapshot, Notifications, Review (linhas 192-194)

**4. Atualizar showContinueButton:**
- Remover referencias a Phase 2 screen 0, Phase 3, Phase 4, Phase 5 screen 1

**5. Atualizar SCREENS_PER_PHASE:**
```typescript
// Antes: [10, 3, 1, 4, 2, 6]
// Depois: [10, 3, 0, 0, 0, 3]
// Phase 2: 0 telas (DreamOutcome removida)
// Phase 3: 0 telas (todas removidas)
// Phase 4: 0 telas (todas removidas)
// Phase 5: 3 telas (Signup, Paywall, Install - removidas Snapshot, Notifications, Review)
```

---

### Nova Estrutura de Fases Apos Exclusao

| Phase | Telas Restantes | Contagem |
|-------|-----------------|----------|
| 0 | Welcome, HowWeHelp, StartQuestionnaire, Username, ContentGoal, StickingPoints, Diferencial, MonthsTrying, Constancia, ClusterFeedback | 10 |
| 1 | BehavioralScience, DailyTime, CreationTime | 3 |
| 2 | (vazio - sera preenchido depois) | 0 |
| 3 | (vazio - sera preenchido depois) | 0 |
| 4 | (vazio - sera preenchido depois) | 0 |
| 5 | Signup, Paywall, Install | 3 |

---

### Alternativa: Simplificar para Menos Phases

Como Phases 2, 3 e 4 ficarao vazias, podemos simplificar:

```typescript
SCREENS_PER_PHASE = [10, 3, 3]; // 3 phases totais
// Phase 0: 10 telas (diagnostico completo)
// Phase 1: 3 telas (ciencia comportamental + configuracao)
// Phase 2: 3 telas (Signup, Paywall, Install)
```

Esta opcao eh mais limpa, mas altera a logica de navegacao. Voce prefere manter as 6 phases (com algumas vazias para preencher depois) ou simplificar para 3?

---

### Ordem de Execucao

1. Excluir os 10 arquivos de componentes
2. Excluir os 2 arquivos de componentes compartilhados orfaos
3. Remover imports em NewOnboarding.tsx
4. Atualizar renderScreen() removendo referencias
5. Atualizar canContinue() removendo validacoes
6. Atualizar showContinueButton
7. Atualizar SCREENS_PER_PHASE em src/types/onboarding.ts

---

### Secao Tecnica

**Diretorios que ficarao vazios apos exclusao:**
- `src/components/onboarding/screens/phase3/` - sera excluido
- `src/components/onboarding/screens/phase4/` - sera excluido
- `src/components/onboarding/screens/phase5/` - sera excluido

**Fluxo pos-exclusao:**
Phase 0 (10 telas) → Phase 1 (3 telas) → Phase 5 (Signup → Paywall → Install)

O usuario navegara diretamente da ultima tela da Phase 1 (CreationTime) para a primeira tela da Phase 5 (Signup), pulando Phases 2, 3 e 4 que estarao vazias.

**Risco:**
- Usuarios com progresso salvo em telas removidas podem ter comportamento inesperado
- Mitigacao: O hook useOnboarding ja valida e ajusta phase/screen para valores validos
