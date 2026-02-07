

# Plano: Corrigir Navegação após Encerrar Sessão no Timer

## Diagnóstico Detalhado

### Por que Session.tsx funciona e EditingWorkspace não?

| Componente | Padrão usado | Resultado |
|------------|--------------|-----------|
| Session.tsx (`handleEnd`) | `await triggerFullCelebration(..., () => navigate('/'))` | ✅ Funciona |
| EditingWorkspace (`handleComplete`) | `await triggerFullCelebration(..., () => navigate('/calendario'))` | ✅ Funciona |
| EditingWorkspace (`onStop` do timer) | `await endSession(); navigate('/')` | ❌ Não funciona |

### O que acontece no bug

```text
1. Usuário clica "Encerrar sessão" no timer
2. DraggableSessionTimer.handleConfirmEnd() é chamado
3. handleConfirmEnd NÃO É ASYNC - chama onStop() sem await
4. onStop async inicia execução
5. setHasEndedSession(true) é chamado
6. await endSession() começa...
7. Dentro de endSession, resetTimer() é chamado
8. session.isActive = false → Timer some da tela (condição falsa)
9. O componente DraggableSessionTimer desmonta
10. navigate('/') pode não executar corretamente porque o contexto mudou
```

### Por que triggerFullCelebration funciona

O `triggerFullCelebration` armazena o callback de navegação e o executa **após** a celebração terminar, em um contexto estável. Ele não depende do timer estar montado.

## Solução

Alterar o `onStop` do EditingWorkspace para seguir o mesmo padrão do `handleEnd` de Session.tsx:

### Código Atual (bugado)
```typescript
onStop={async () => {
  setHasEndedSession(true);
  await endSession();
  navigate('/');  // ← Pode não executar
}}
```

### Código Corrigido
```typescript
onStop={async () => {
  // Capturar dados ANTES do reset
  const capturedDuration = session.elapsedSeconds;
  
  setHasEndedSession(true);
  
  const result = await endSession();
  if (result) {
    const sessionSummary = {
      duration: result.duration || capturedDuration || 0,
      xpGained: result.xpGained || 0,
      stage: 'edit',
    };
    
    const alreadyCounted = (result as any).alreadyCounted || false;
    const shouldShowStreak = (result as any).shouldShowCelebration && !alreadyCounted;
    const streakCountResult = shouldShowStreak ? ((result as any).newStreak || 0) : 0;
    
    // Usar triggerFullCelebration com callback de navegação
    await triggerFullCelebration(sessionSummary, streakCountResult, result.xpGained || 0, () => {
      navigate('/');
    });
  } else {
    // Fallback: navegação direta se endSession falhar
    navigate('/');
  }
}}
```

## Por que esta solução funciona

1. **Captura dados antes do reset**: Garante que temos os valores corretos da sessão
2. **Usa triggerFullCelebration**: O callback de navegação é armazenado e executado em contexto estável
3. **Mostra celebração**: Experiência consistente - usuário vê o resumo da sessão ao encerrar
4. **Fallback de segurança**: Se `endSession` falhar, ainda navega para home

## Benefício Adicional

Esta mudança também traz consistência UX:
- Encerrar pelo timer agora mostra celebração (SessionSummary, StreakCelebration)
- Antes, só o botão "Marcar como Editado" mostrava celebração
- Experiência unificada independente de como o usuário encerra

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Substituir `onStop` do DraggableSessionTimer para usar `triggerFullCelebration` |

## Resultado Esperado

1. Usuário clica "Encerrar sessão" no timer
2. `setHasEndedSession(true)` previne reinício
3. `await endSession()` salva dados e reseta timer
4. `triggerFullCelebration` armazena callback de navegação
5. SessionSummary aparece mostrando tempo trabalhado
6. Usuário clica "Continuar"
7. StreakCelebration aparece (se aplicável)
8. Ao final, callback executa `navigate('/')`
9. Usuário é redirecionado para home corretamente

