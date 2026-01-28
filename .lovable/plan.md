

## Plano: Excluir Telas Antigas do Onboarding (Batch 1)

### Objetivo

Remover 10 componentes de telas antigas do onboarding que serao substituidos pelas novas telas que estamos construindo. Este e o primeiro batch - voce mencionou que tem mais telas para enviar depois.

---

### Telas a Excluir

| # | Print | Componente | Caminho |
|---|-------|------------|---------|
| 1 | "O que mais te trava?" | Screen4StickingPoints | `phase2/Screen4StickingPoints.tsx` |
| 2 | "Ha quanto tempo voce tenta?" | Screen5MonthsTrying | `phase2/Screen5MonthsTrying.tsx` |
| 3 | "Quantos posts voce ja fez?" | Screen6CurrentPosts | `phase2/Screen6CurrentPosts.tsx` |
| 4 | "O que voce ja tentou?" | Screen7PreviousAttempts | `phase2/Screen7PreviousAttempts.tsx` |
| 5 | "Voce perdeu 90 oportunidades" | Screen9LostPosts | `phase3/Screen9LostPosts.tsx` |
| 6 | "6 meses tentando sozinho" | Screen10TimeWasted | `phase3/Screen10TimeWasted.tsx` |
| 7 | "O custo real da inconsistencia" | Screen11AccumulatedImpact | `phase3/Screen11AccumulatedImpact.tsx` |
| 8 | "30 posts em 30 dias" | Screen12Opportunity | `phase3/Screen12Opportunity.tsx` |
| 9 | "O quanto isso importa pra voce?" | Screen8ImpactScale | `phase2/Screen8ImpactScale.tsx` |
| 10 | "A ciencia dos 25 minutos" | Screen14TwentyFiveMinutes | `phase4/Screen14TwentyFiveMinutes.tsx` |

---

### Arquivos a Excluir

**Phase 2 (5 arquivos):**
```
src/components/onboarding/screens/phase2/Screen4StickingPoints.tsx
src/components/onboarding/screens/phase2/Screen5MonthsTrying.tsx
src/components/onboarding/screens/phase2/Screen6CurrentPosts.tsx
src/components/onboarding/screens/phase2/Screen7PreviousAttempts.tsx
src/components/onboarding/screens/phase2/Screen8ImpactScale.tsx
```

**Phase 3 (4 arquivos):**
```
src/components/onboarding/screens/phase3/Screen9LostPosts.tsx
src/components/onboarding/screens/phase3/Screen10TimeWasted.tsx
src/components/onboarding/screens/phase3/Screen11AccumulatedImpact.tsx
src/components/onboarding/screens/phase3/Screen12Opportunity.tsx
```

**Phase 4 (1 arquivo):**
```
src/components/onboarding/screens/phase4/Screen14TwentyFiveMinutes.tsx
```

---

### Impacto no NewOnboarding.tsx

Apos a exclusao, sera necessario:
1. Remover os imports desses componentes
2. Remover as referencias no `renderScreen()` para Phase 1 (screens 3-7) e outras phases
3. Atualizar o `SCREENS_PER_PHASE` para refletir a nova contagem

**Observacao:** Como estamos no meio da reconstrucao do onboarding, provavelmente teremos erros de compilacao ate substituirmos todas as telas. Posso remover tambem as referencias no NewOnboarding.tsx ou voce prefere fazer isso quando todas as novas telas estiverem prontas?

---

### Ordem de Execucao

1. Excluir os 10 arquivos de componentes listados
2. (Opcional) Remover imports e referencias no NewOnboarding.tsx
3. (Opcional) Atualizar SCREENS_PER_PHASE

---

### Secao Tecnica

**Por que excluir agora?**
- Evita confusao entre telas antigas e novas
- Limpa o codebase de componentes nao utilizados
- Facilita a manutencao do fluxo de onboarding

**Riscos:**
- Erros de compilacao se NewOnboarding.tsx ainda referenciar esses componentes
- Solucao: Remover referencias junto com os arquivos

