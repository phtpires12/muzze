
# Plano: Adicionar Resolução de URLs de Imagens na Mesa de Edição

## Problema Atual

O `ShotlistPanel` já aceita a prop `resolvedUrls`, mas o `EditingWorkspace` não está:
1. Extraindo os paths das imagens dos shots
2. Gerando signed URLs usando `generateSignedUrlsBatch()`
3. Passando essas URLs resolvidas para o componente

## Solução

Seguir o padrão já implementado em `ShotListRecord.tsx`:

```text
┌─────────────────────────────────────────────────────────────────┐
│  EditingWorkspace.tsx                                           │
│                                                                 │
│  1. Adicionar state: resolvedUrls                               │
│  2. Extrair todos os shotImagePaths dos shots                   │
│  3. Chamar generateSignedUrlsBatch() após carregar dados        │
│  4. Passar resolvedUrls para ShotlistPanel                      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  ShotlistPanel.tsx                                              │
│                                                                 │
│  - Já aceita resolvedUrls?: Record<string, string>              │
│  - Já usa: resolvedUrls[shot.shotImagePaths?.[0]]               │
│  - Apenas precisa receber os dados                              │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Adicionar lógica de resolução de URLs e passar prop |

## Detalhamento Técnico

### 1. Adicionar Import

```typescript
import { generateSignedUrlsBatch } from "@/lib/storage-helpers";
```

### 2. Adicionar State

```typescript
const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
```

### 3. Adicionar Função de Resolução

```typescript
// Resolve image URLs from storage paths
const resolveImageUrls = useCallback(async (shots: ShotItem[]) => {
  const allPaths: string[] = [];
  shots.forEach(shot => {
    (shot.shotImagePaths || []).forEach(path => {
      if (path && !allPaths.includes(path)) {
        allPaths.push(path);
      }
    });
  });
  
  if (allPaths.length === 0) return;
  
  const urlMap = await generateSignedUrlsBatch(allPaths, 86400); // 24h
  
  // Convert Map to Record for the component
  const urlRecord: Record<string, string> = {};
  urlMap.forEach((url, path) => {
    urlRecord[path] = url;
  });
  
  setResolvedUrls(urlRecord);
}, []);
```

### 4. Chamar Após Carregar Dados

No `loadScript`, após processar o `shot_list`:

```typescript
// Resolve image URLs after loading
if (parsedShots.length > 0) {
  resolveImageUrls(parsedShots);
}
```

### 5. Passar Prop para ShotlistPanel

```tsx
<ShotlistPanel 
  shots={shots} 
  onUpdateShot={handleUpdateShot}
  resolvedUrls={resolvedUrls}  // ADICIONAR
/>
```

## Fluxo de Dados

```text
        Banco de Dados
              │
              ▼
   shot_list com shotImagePaths
              │
              ▼
   ┌──────────────────────────┐
   │  generateSignedUrlsBatch │
   │  (paths → signed URLs)   │
   └────────────┬─────────────┘
                │
                ▼
        resolvedUrls state
                │
                ▼
   ┌──────────────────────────┐
   │     ShotlistPanel        │
   │  exibe thumbnails 16:9   │
   └──────────────────────────┘
```

## Resultado Esperado

- Thumbnails das cenas aparecerão nos cards 16:9 da galeria
- Imagens de referência carregadas via signed URLs (válidas por 24h)
- Se não houver imagem, placeholder cinza continua aparecendo
