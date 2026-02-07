
# Plano: Corrigir Encerramento de Sessão no EditingWorkspace

## Diagnóstico do Problema

### O que acontece atualmente (bug)

```text
1. Usuário clica "Encerrar sessão" no timer
2. onStop() é chamado
3. await endSession() → session.isActive = false
4. React re-renderiza ANTES de navigate('/')
5. useEffect detecta !session.isActive → chama startSession('edit')
6. Nova sessão inicia → session.isActive = true
7. navigate('/') tenta executar
8. useNavigationBlocker BLOQUEIA (sessão ativa + rota '/' não está em SAFE_SESSION_PATHS)
9. Warning: "A router only supports one blocker at a time"
```

### Por que Session.tsx funciona

A página Session.tsx implementa um padrão de proteção usando um flag `hasEndedSession`:

| Passo | Session.tsx (correto) | EditingWorkspace.tsx (bug) |
|-------|----------------------|---------------------------|
| 1 | `setHasEndedSession(true)` **antes** de endSession | Não usa flag |
| 2 | `await endSession()` | `await endSession()` |
| 3 | useEffect verifica `!hasEndedSession` | useEffect NÃO verifica |
| 4 | Não reinicia sessão | **Reinicia sessão** (bug) |

## Solução

Implementar o mesmo padrão de proteção do `Session.tsx` no `EditingWorkspace.tsx`:

### 1. Adicionar o flag `hasEndedSession`

```typescript
const [hasEndedSession, setHasEndedSession] = useState(false);
```

### 2. Atualizar o useEffect de auto-start

```typescript
useEffect(() => {
  // NÃO iniciar sessão se acabou de encerrar ou em celebração
  if (!session.isActive && !isShowingAnyCelebration && !hasEndedSession) {
    startSession('edit');
  }
}, [session.isActive, isShowingAnyCelebration, hasEndedSession, startSession]);
```

### 3. Atualizar o onStop do timer

```typescript
onStop={async () => {
  // Ativar flag ANTES de encerrar para evitar reinício
  setHasEndedSession(true);
  await endSession();
  navigate('/');
}}
```

### 4. Atualizar handleComplete também

```typescript
const handleComplete = useCallback(async () => {
  // ... código existente ...
  
  // Ativar flag ANTES de encerrar
  setHasEndedSession(true);
  
  // Save timer session
  await saveCurrentStageTime();
  
  // End session with celebration
  const result = await endSession();
  // ... resto do código ...
}, [/* deps */]);
```

## Arquivo a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/EditingWorkspace.tsx` | Adicionar `hasEndedSession` state e verificações |

## Resumo das Alterações

| Linha atual | Alteração |
|-------------|-----------|
| ~39 | Adicionar `const [hasEndedSession, setHasEndedSession] = useState(false);` |
| ~79-82 | Adicionar `&& !hasEndedSession` na condição do useEffect |
| ~234 (handleComplete) | Adicionar `setHasEndedSession(true);` antes de endSession |
| ~389-392 (onStop) | Adicionar `setHasEndedSession(true);` antes de endSession |

## Resultado Esperado

1. Usuário clica "Encerrar sessão"
2. `setHasEndedSession(true)` é chamado
3. `await endSession()` → `session.isActive = false`
4. React re-renderiza, useEffect detecta `!session.isActive`
5. Mas `hasEndedSession = true` → **NÃO reinicia sessão**
6. `navigate('/')` executa sem bloqueio
7. Usuário é redirecionado para home corretamente
