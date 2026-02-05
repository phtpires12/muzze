

# Plano: Corrigir Exibição da Shotlist (Re-aplicar Fix)

## Problema Confirmado

O código em `EditingWorkspace.tsx` (linhas 109-114) ainda está mapeando incorretamente:

```typescript
// ATUAL - Errado
const shots: ShotItem[] = (script?.shot_list || []).map((desc, index) => ({
  id: `shot-${index}`,
  description: desc,  // ← 'desc' é um objeto JSON, não uma string!
  order: index,
}));
```

## Solução

### 1. Corrigir mapeamento em `EditingWorkspace.tsx` (linhas 109-114)

Substituir por:

```typescript
// Converter shot_list (JSON objects) para ShotItem
const shots: ShotItem[] = (script?.shot_list || []).map((item: any, index: number) => {
  // Se for string (formato antigo), parsear como JSON
  const shotData = typeof item === 'string' ? JSON.parse(item) : item;
  
  return {
    id: shotData.id || `shot-${index}`,
    description: shotData.scriptSegment || '', // Texto limpo do roteiro
    imageUrl: shotData.shotImageUrls?.[0] || undefined,
    location: shotData.location || undefined,
    isComplex: false,
    order: index,
    sectionName: shotData.sectionName,
    isCompleted: shotData.isCompleted || false,
  };
});
```

### 2. Atualizar interface em `ShotlistPanel.tsx`

Adicionar campos que faltam:

```typescript
export interface ShotItem {
  id: string;
  description: string;
  imageUrl?: string;
  location?: string;
  isComplex?: boolean;
  isCompleted?: boolean;  // ← Adicionar
  sectionName?: string;   // ← Adicionar
  order: number;
}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Linhas 109-114: extrair `scriptSegment` do objeto JSON |
| `src/components/editing/ShotlistPanel.tsx` | Adicionar `isCompleted` e `sectionName` à interface |

## Resultado Esperado

**Antes:** `{"id":"acc819fe-...","scriptSegment":"2026 vai ser o ano..."`

**Depois:** `2026 vai ser o ano em que o processo de criação vai ser mais importante que a arte.`

