
# Plano: Corrigir Vinculação de Vídeo no Modal

## Problema Identificado

O `handleUpdateShot` no `EditingWorkspace.tsx` não está parseando as strings JSON do `shot_list` para extrair o ID real, causando incompatibilidade:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Modal envia:                                                          │
│  shotId = "abc123-uuid-real"  ← ID real do objeto parseado             │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  handleUpdateShot compara:                                             │
│                                                                        │
│  script.shot_list = [                                                  │
│    "{\"id\":\"abc123-uuid-real\",...}",  ← STRING JSON                 │
│    "{\"id\":\"def456-uuid-real\",...}"                                 │
│  ]                                                                     │
│                                                                        │
│  typeof item === 'string'  → true                                      │
│  itemId = "shot-0"         ← ID genérico gerado                        │
│                                                                        │
│  "shot-0" === "abc123-uuid-real"  → FALSE                              │
│  → Atualização NUNCA acontece!                                         │
└────────────────────────────────────────────────────────────────────────┘
```

## Solução

Modificar `handleUpdateShot` para parsear strings JSON antes de comparar IDs:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  ANTES (quebrado):                                                     │
│                                                                        │
│  const itemId = typeof item === 'string'                               │
│    ? `shot-${index}`    ← Errado! Gera ID genérico                     │
│    : (item.id || ...)                                                  │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  DEPOIS (corrigido):                                                   │
│                                                                        │
│  let parsed = item;                                                    │
│  if (typeof item === 'string') {                                       │
│    try { parsed = JSON.parse(item); } catch {}                         │
│  }                                                                     │
│  const itemId = parsed.id || `shot-${index}`;                          │
│                    ↑                                                   │
│         Agora extrai o ID real do JSON parseado!                       │
└────────────────────────────────────────────────────────────────────────┘
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Corrigir `handleUpdateShot` para parsear JSON |

## Código Corrigido

```typescript
const handleUpdateShot = useCallback(async (shotId: string, updates: Partial<ShotItem>) => {
  if (!scriptId || !script?.shot_list) return;
  
  const updatedShotList = (script.shot_list as any[]).map((item: any, index) => {
    // Parse JSON string if needed to get the real ID
    let parsed = item;
    if (typeof item === 'string') {
      try {
        parsed = JSON.parse(item);
      } catch {
        // Plain text fallback - use index-based ID
        parsed = { id: `shot-${index}`, scriptSegment: item };
      }
    }
    
    const itemId = parsed.id || `shot-${index}`;
    
    if (itemId === shotId) {
      // Apply updates to the parsed object
      const updated = { ...parsed, ...updates };
      // Return as JSON string to maintain format consistency
      return JSON.stringify(updated);
    }
    
    // Return original item unchanged (keep as string if it was string)
    return item;
  });

  const { error } = await supabase
    .from('scripts')
    .update({ shot_list: updatedShotList as any })
    .eq('id', scriptId);

  if (!error) {
    setScript(prev => prev ? { ...prev, shot_list: updatedShotList } : null);
  }
}, [scriptId, script?.shot_list]);
```

## Fluxo Corrigido

```text
┌────────────────────────────────────────────────────────────────────────┐
│  1. Modal envia: shotId = "abc123-uuid-real"                           │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. handleUpdateShot recebe shot_list[0] = "{\"id\":\"abc123...\"}"    │
│                                                                        │
│     typeof item === 'string' → true                                    │
│     parsed = JSON.parse(item) → { id: "abc123-uuid-real", ... }        │
│     itemId = parsed.id → "abc123-uuid-real"                            │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  3. Comparação:                                                        │
│     "abc123-uuid-real" === "abc123-uuid-real" → TRUE ✓                 │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  4. Aplica updates:                                                    │
│     updated = { ...parsed, videoUrl: "https://...", videoType: "..." } │
│     return JSON.stringify(updated)                                     │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  5. Salva no banco e atualiza state                                    │
│     → UI reflete a vinculação corretamente                             │
└────────────────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

- Vinculação de vídeo funcionará tanto no card quanto no modal
- IDs reais dos shots serão corretamente matchados
- Formato de armazenamento (JSON strings) será mantido
- Compatibilidade com dados legados preservada
