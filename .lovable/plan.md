
# Plano: Corrigir Exibição da Shotlist (Problema 1)

## Problema Identificado

O JSON bruto está aparecendo porque o `EditingWorkspace.tsx` está mapeando incorretamente os dados do `shot_list`:

```typescript
// Código atual (linha 109-114 do EditingWorkspace.tsx)
const shots: ShotItem[] = (script?.shot_list || []).map((desc, index) => ({
  id: `shot-${index}`,
  description: desc,  // ← 'desc' é um objeto JSON, não uma string!
  order: index,
}));
```

### Dados Reais no Banco

O `shot_list` contém objetos com esta estrutura:
```json
{
  "id": "acc819fe-1eb5-471a-b567-1a319a2fcf25",
  "scriptSegment": "2026 vai ser o ano em que...",
  "scene": "",
  "location": "",
  "sectionName": "Gancho",
  "shotImagePaths": [],
  "isCompleted": false
}
```

O campo `scriptSegment` contém o texto limpo que o usuário quer ver.

---

## Solução

### 1. Atualizar o tipo e mapeamento em `EditingWorkspace.tsx`

Alterar a lógica de mapeamento para extrair corretamente os campos do objeto JSON:

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
    isComplex: false, // Pode ser mapeado de outro campo futuramente
    order: index,
    sectionName: shotData.sectionName,
    isCompleted: shotData.isCompleted || false,
  };
});
```

### 2. Atualizar a interface `ShotItem` em `ShotlistPanel.tsx`

Adicionar campos opcionais que podem ser úteis:

```typescript
export interface ShotItem {
  id: string;
  description: string;
  imageUrl?: string;
  location?: string;
  isComplex?: boolean;
  isCompleted?: boolean;
  sectionName?: string;
  order: number;
}
```

---

## Mudanças de Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Corrigir mapeamento para extrair `scriptSegment` |
| `src/components/editing/ShotlistPanel.tsx` | Adicionar campos opcionais à interface |

---

## Resultado Esperado

**Antes:** 
```
{"id":"acc819fe-...","scriptSegment":"2026 vai ser o ano...","scene":"","shotImagePaths":...
```

**Depois:**
```
2026 vai ser o ano em que o processo de criação vai ser mais importante que a arte.
```

---

## Critérios de Aceite

- [ ] Cada cena exibe apenas o texto do roteiro (`scriptSegment`)
- [ ] IDs internos não aparecem para o usuário
- [ ] Seção (Gancho, Setup, etc.) pode ser exibida como badge opcional
- [ ] Dados de localização são preservados quando existem
