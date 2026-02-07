

# Plano: Corrigir Exclusão de Shotlist

## Problema

Quando o usuário exclui a shotlist, a navegação para `/calendario` é bloqueada pelo `useNavigationBlocker` porque há uma sessão ativa. Isso causa:

1. Toast "Shotlist excluída" aparece corretamente
2. Banco de dados é atualizado (shot_list = [])
3. Modal "Encerrar sessão?" aparece bloqueando a navegação
4. Usuário permanece na página com a shotlist visualmente presente

## Causa Raiz

O `handleDeleteShotlist` chama `navigate('/calendario')` enquanto há sessão ativa. O `useNavigationBlocker` intercepta essa navegação e exige confirmação.

## Solução

Encerrar a sessão **antes** de navegar quando a shotlist é excluída. Isso faz sentido semanticamente porque o usuário está abandonando o trabalho nesse conteúdo.

## Alteração Técnica

Modificar `handleDeleteShotlist` em `src/pages/ShotListReview.tsx`:

```typescript
const handleDeleteShotlist = async () => {
  if (!scriptId) return;
  
  setIsDeletingShotlist(true);
  
  try {
    // 1. Coletar todos os paths de imagens
    const allImagePaths: string[] = [];
    shots.forEach(shot => {
      (shot.shotImagePaths || []).forEach(path => {
        if (path && !allImagePaths.includes(path)) {
          allImagePaths.push(path);
        }
      });
    });
    
    // 2. Apagar imagens do storage
    if (allImagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('shot-references')
        .remove(allImagePaths);
      
      if (storageError) {
        console.error('Error removing images:', storageError);
      }
    }
    
    // 3. Limpar shot_list no banco
    const { error } = await supabase
      .from('scripts')
      .update({ shot_list: [] })
      .eq('id', scriptId);
    
    if (error) throw error;
    
    // 4. IMPORTANTE: Salvar tempo da sessão e encerrar ANTES de navegar
    await saveCurrentStageTime();
    await endSession();
    
    toast({
      title: "Shotlist excluída",
      description: "A shotlist foi removida com sucesso",
    });
    
    // 5. Navegar - agora não será bloqueado porque sessão está encerrada
    navigate('/calendario');
    
  } catch (error) {
    console.error('Error deleting shotlist:', error);
    toast({
      title: "Erro ao excluir",
      description: "Não foi possível excluir a shotlist",
      variant: "destructive",
    });
  } finally {
    setIsDeletingShotlist(false);
    setShowDeleteShotlistModal(false);
  }
};
```

## Por que essa solução?

1. **Semanticamente correta**: Excluir a shotlist significa abandonar o trabalho nesse conteúdo
2. **Salva o progresso**: O tempo da sessão é registrado antes de sair
3. **Evita o blocker**: Com sessão encerrada, `timer.isActive = false`, então `useNavigationBlocker` não bloqueia
4. **Sem efeitos colaterais**: Não precisa modificar o blocker nem adicionar rotas à lista segura

## Alteração Adicional (Opcional)

Também podemos **não disparar celebração** neste caso, já que não é uma conclusão de trabalho - é um abandono. A sessão seria encerrada silenciosamente:

```typescript
// Encerrar sessão sem disparar celebração
if (session.isActive) {
  await saveCurrentStageTime();
  // Encerrar internamente sem triggerFullCelebration
  // Podemos usar uma função interna ou simplesmente não chamar endSession
}
```

Porém, para simplicidade, a solução principal já resolve o problema.

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListReview.tsx` | Adicionar `saveCurrentStageTime()` e `endSession()` antes de `navigate()` em `handleDeleteShotlist` |

## Resultado Esperado

1. Usuário clica em "Excluir Shotlist"
2. Modal de confirmação aparece
3. Usuário clica em "Excluir Shotlist" (confirmar)
4. Imagens são removidas do storage
5. `shot_list` é setado como array vazio no banco
6. Sessão é encerrada silenciosamente
7. Toast "Shotlist excluída" aparece
8. Navegação para `/calendario` ocorre sem bloqueio

