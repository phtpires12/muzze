

## Correcao: Botao "Voltar ao Calendario" no IdeaDetail

### Problema

O botao "Voltar ao Calendario" faz apenas `navigate("/calendario")`, mas como existe uma sessao ativa com timer rodando, o `useNavigationBlocker` intercepta e bloqueia a navegacao. O botao "Excluir ideia" funciona porque chama `resetTimer()` antes de navegar.

### Solucao

Aplicar no botao "Voltar ao Calendario" o mesmo padrao usado pela navbar (AutoHideNav/SideNav): salvar tempo da etapa, encerrar sessao, disparar celebracoes, e so entao navegar para `/calendario`.

### Detalhes tecnicos

**Arquivo: `src/components/brainstorm/IdeaDetail.tsx`**

1. **Importar hooks necessarios**:
   - `useSession` (para `endSession`, `saveCurrentStageTime`, `session`)
   - `useCelebration` (para `triggerFullCelebration`)
   - `useSoundEffects` (para tocar som de complete)

2. **Criar funcao `handleBackToCalendar`**:
   - Toca som 'complete'
   - Captura duracao e stage antes de encerrar
   - Chama `saveCurrentStageTime()`
   - Chama `endSession()`
   - Monta `sessionSummary` e `streakCount`
   - Chama `triggerFullCelebration` com callback que faz `navigate("/calendario")`

3. **Atualizar o onClick do botao** (linha 453):
   - Trocar `onClick={() => navigate("/calendario")}` por `onClick={handleBackToCalendar}`

O padrao segue exatamente o `handleConfirmEnd` do AutoHideNav, garantindo que XP, streak e celebracoes funcionem corretamente ao sair via esse botao.
