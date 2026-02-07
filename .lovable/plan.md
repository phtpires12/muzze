

# Plano: Exclusão de Shotlist - Voltar para Review

## Resumo do Comportamento Correto

Ao excluir a shotlist, o usuário deve:

| Ação | Comportamento |
|------|---------------|
| Sessão | Mantém ativa ✓ |
| Navegação | Volta para `/session?stage=review&scriptId=...` |
| Destino | Página de revisão onde pode criar nova shotlist ou avançar para gravação |

## Fluxo Esperado

```text
ShotListReview → [Excluir Shotlist] → Session (stage=review)
                                          ↓
                                    Usuário pode:
                                    ├── Revisar texto
                                    ├── Comparar versões
                                    ├── "Criar Shot List" novamente
                                    └── "Avançar para Gravação" (modo frase a frase)
```

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
    
    toast({
      title: "Shotlist excluída",
      description: "Você pode criar uma nova ou avançar para gravação",
    });
    
    // 4. Voltar para página de Review (NÃO encerra sessão)
    // A rota /session com stage=review está na lista SAFE_SESSION_PATHS
    // então não será bloqueada pelo useNavigationBlocker
    navigate(`/session?stage=review&scriptId=${scriptId}`);
    
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

## Por que funciona sem bloqueio

A rota `/session` está na lista `SAFE_SESSION_PATHS` em `useNavigationBlocker.ts`:

```typescript
const SAFE_SESSION_PATHS = [
  '/session',        // ✓ Navegação para cá não é bloqueada
  '/shot-list',
  '/shot-list/record',
  '/shot-list/review',
  '/editing-workspace',
  '/settings',
  '/profile',
];
```

Portanto, a navegação de `/shot-list/review` para `/session?stage=review` não será interceptada.

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ShotListReview.tsx` | Trocar `resetTimer()` + `navigate('/calendario')` por `navigate('/session?stage=review&scriptId=${scriptId}')` |

## Resultado Esperado

1. Usuário clica em "Excluir Shotlist"
2. Modal de confirmação aparece
3. Usuário confirma
4. Imagens removidas do storage ✓
5. `shot_list = []` no banco ✓
6. Toast "Shotlist excluída" ✓
7. Navega para página de Review (imagem anexada)
8. Timer continua rodando normalmente
9. Usuário vê botão "Criar Shot List" disponível novamente
10. Pode criar nova shotlist ou clicar "Avançar para Gravação"

