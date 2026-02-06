
# Plano: Corrigir Exibição de JSON Bruto na Mesa de Edição (Shotlist)

## Problema Identificado

O JSON bruto aparece nos cards da Shotlist porque o código trata os dados como strings simples, mas eles são **objetos complexos** salvos no banco.

### Evidência

Screenshot mostra: `{"id":"acc819fe-1eb5-471a-b567...","scriptSegment":"<p>2026 vai ser o ano...`

Este é o objeto completo da shotlist sendo renderizado como texto.

## Causa Raiz

```text
┌────────────────────────────────────────────────────┐
│  Banco de Dados (shot_list)                        │
│  Array de OBJETOS:                                 │
│  [{id, scriptSegment, scene, shotImagePaths,...}]  │
└───────────────────┬────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│  EditingWorkspace.tsx (linha 110-114)              │
│                                                    │
│  const shots = (script?.shot_list || [])           │
│    .map((desc, index) => ({                        │
│       description: desc,  ← ERRO: desc é objeto!   │
│    }));                                            │
└───────────────────┬────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│  ShotlistPanel.tsx (linha 154)                     │
│                                                    │
│  <p>{shot.description}</p>                         │
│  ↓                                                 │
│  Renderiza: {"id":"...", "scriptSegment":"..."}    │
└────────────────────────────────────────────────────┘
```

## Solução

Corrigir o mapeamento em `EditingWorkspace.tsx` para extrair o campo `scriptSegment` do objeto:

```typescript
// ANTES (errado):
const shots: ShotItem[] = (script?.shot_list || []).map((desc, index) => ({
  id: `shot-${index}`,
  description: desc,  // desc é objeto, não string
  order: index,
}));

// DEPOIS (correto):
const shots: ShotItem[] = (script?.shot_list || []).map((item: any, index) => {
  // Se item for string (formato antigo), usar direto
  if (typeof item === 'string') {
    return {
      id: `shot-${index}`,
      description: item,
      order: index,
    };
  }
  
  // Se item for objeto (formato atual), extrair campos
  return {
    id: item.id || `shot-${index}`,
    description: item.scriptSegment || item.description || '',
    imageUrl: item.shotImagePaths?.[0] || undefined,
    location: item.location || undefined,
    order: index,
  };
});
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Corrigir mapeamento de `shot_list` para extrair `scriptSegment` corretamente |

---

## Por que isso não é cache

O código que você está vendo **já é o código correto** no repositório - o problema é que o **mapeamento de dados** está errado. Não importa quantas vezes você limpe o cache, o bug vai continuar porque está na lógica do código, não no cache.

A razão pela qual "funcionava antes" pode ser:
1. Os dados antigos eram salvos como strings simples
2. Os dados novos são salvos como objetos completos
3. O código não foi atualizado para lidar com o novo formato

---

## Resultado Esperado

- Cards da Shotlist mostrarão o **texto do roteiro** (`scriptSegment`) ao invés do JSON bruto
- Imagens de referência (`shotImagePaths`) serão exibidas quando disponíveis
- Locação será exibida como badge
- Compatibilidade com dados antigos (strings) e novos (objetos)
