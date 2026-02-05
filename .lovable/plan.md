
# Plano: Corrigir Erro "VideoReferencesPanel is not defined"

## Problema

O arquivo `EditingWorkspace.tsx` ainda contém referências ao `VideoReferencesPanel` que deveria ter sido removido:

- **Linha 12**: Import do componente
- **Linhas 117-141**: Handlers de video references (`saveVideoReferences`, `handleAddVideoRef`, `handleRemoveVideoRef`)
- **Linhas 293-297**: JSX usando `<VideoReferencesPanel>`

## Solução

### 1. Remover import na linha 12

```typescript
// REMOVER ESTA LINHA:
import { VideoReferencesPanel, VideoReference } from "@/components/editing/VideoReferencesPanel";
```

### 2. Atualizar interface ScriptData (linhas 20-27)

Remover `video_references`:

```typescript
interface ScriptData {
  id: string;
  title: string;
  shot_list: any[] | null;  // Mudado de string[] para any[]
  music_reference: MusicReference | null;
  editing_notes: string | null;
}
```

### 3. Remover handlers não utilizados (linhas 117-141)

Remover completamente:
- `saveVideoReferences`
- `handleAddVideoRef`
- `handleRemoveVideoRef`

### 4. Remover JSX do VideoReferencesPanel (linhas 292-297)

Remover completamente o bloco `<VideoReferencesPanel ... />`

### 5. Corrigir mapeamento de shots (linhas 109-114)

Atualizar para extrair `scriptSegment` corretamente:

```typescript
const shots: ShotItem[] = (script?.shot_list || []).map((item: any, index: number) => {
  const shotData = typeof item === 'string' ? JSON.parse(item) : item;
  return {
    id: shotData.id || `shot-${index}`,
    description: shotData.scriptSegment || '',
    scene: shotData.scene || undefined,
    imageUrl: shotData.shotImageUrls?.[0] || undefined,
    location: shotData.location || undefined,
    sectionName: shotData.sectionName || undefined,
    videoUrl: shotData.videoUrl || undefined,
    isCompleted: shotData.isCompleted || false,
    order: index,
  };
});
```

### 6. Adicionar handler para atualizar shots

```typescript
const handleShotsChange = useCallback(async (updatedShots: ShotItem[]) => {
  if (!scriptId || !script?.shot_list) return;
  
  const updatedShotList = script.shot_list.map((item: any, index: number) => {
    const shotData = typeof item === 'string' ? JSON.parse(item) : item;
    const updatedShot = updatedShots.find(s => s.id === shotData.id || s.id === `shot-${index}`);
    return {
      ...shotData,
      videoUrl: updatedShot?.videoUrl || undefined,
    };
  });

  await supabase
    .from('scripts')
    .update({ shot_list: updatedShotList })
    .eq('id', scriptId);

  setScript(prev => prev ? { ...prev, shot_list: updatedShotList } : null);
}, [scriptId, script?.shot_list]);
```

### 7. Atualizar ShotlistPanel no JSX

```tsx
<ShotlistPanel 
  shots={shots} 
  scriptId={script.id}
  onShotsChange={handleShotsChange}
/>
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Remover VideoReferencesPanel, corrigir mapeamento, adicionar handler |

## Resultado Esperado

- Erro "VideoReferencesPanel is not defined" corrigido
- Página de edição carrega normalmente
- Galeria horizontal de shots funcional
- Links de vídeo salvos por cena
