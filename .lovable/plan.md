
# Plano: Corrigir Parsing de shot_list com Strings JSON

## Problema Identificado

O banco de dados armazena `shot_list` como um **array de strings JSON escapadas**, não como um array de objetos. 

### Evidência do Banco:
```
shot_list = [
  "{\"id\":\"acc819fe-1eb5-471a-b567-1a319a2fcf25\",\"scriptSegment\":\"<p>2026 vai ser o ano...\",...}",
  "{\"id\":\"d4b6bd10-2bbe-4809-a9bd-b0e37d8f12e7\",\"scriptSegment\":\"Você já tá vendo...\",...}",
  ...
]
```

Cada elemento é uma **string** que contém JSON, não um objeto JavaScript diretamente acessível.

### O Que Acontece Hoje:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Banco retorna:                                                        │
│  shot_list[0] = "{\"id\":\"abc\",\"scriptSegment\":\"texto...\"}"      │
│                  ↑                                                     │
│            Uma STRING, não objeto                                      │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Código atual:                                                         │
│                                                                        │
│  const shots = shot_list.map(item => ({                                │
│    scriptSegment: item.scriptSegment  ← UNDEFINED! item é string       │
│  }));                                                                  │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Resultado:                                                            │
│                                                                        │
│  scriptSegment = undefined                                             │
│  Fallback para item.description = undefined                            │
│  Fallback final = '' (string vazia)                                    │
│                                                                        │
│  MAS o card mostra o objeto inteiro porque está usando                 │
│  typeof item === 'string' → trata como texto simples                   │
└────────────────────────────────────────────────────────────────────────┘
```

## Solução

Adicionar `JSON.parse()` para cada elemento do array que é uma string contendo JSON.

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Adicionar parsing de strings JSON no mapeamento |

### Lógica Corrigida

```typescript
const shots: ShotItem[] = (script?.shot_list || []).map((item: any, index) => {
  // Parse JSON string if needed
  let parsed = item;
  if (typeof item === 'string') {
    try {
      parsed = JSON.parse(item);
    } catch {
      // Fallback: treat as plain text (legacy format)
      return {
        id: `shot-${index}`,
        scriptSegment: item,
        scene: '',
        location: '',
        shotImagePaths: [],
      };
    }
  }
  
  // Now 'parsed' is guaranteed to be an object
  return {
    id: parsed.id || `shot-${index}`,
    scriptSegment: parsed.scriptSegment || parsed.description || '',
    scene: parsed.scene || '',
    location: parsed.location || '',
    shotImagePaths: parsed.shotImagePaths || [],
    sectionName: parsed.sectionName,
    isCompleted: parsed.isCompleted,
    videoUrl: parsed.videoUrl,
    videoType: parsed.videoType,
  };
});
```

### Dois Lugares a Corrigir

1. **Linha ~131-146**: Parsing dentro do `loadScript()` (para resolver URLs)
2. **Linha ~159-183**: Parsing para gerar o array `shots` exibido

Ambos precisam da mesma lógica de `JSON.parse()` para strings.

## Fluxo Corrigido

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Banco retorna:                                                        │
│  shot_list[0] = "{\"id\":\"abc\",\"scriptSegment\":\"texto...\"}"      │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  typeof item === 'string' ? JSON.parse(item) : item                    │
│                              ↓                                         │
│  parsed = { id: "abc", scriptSegment: "texto..." }                     │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  scriptSegment: parsed.scriptSegment  ← "2026 vai ser o ano..."       │
│  location: parsed.location            ← ""                             │
│  shotImagePaths: parsed.shotImagePaths ← ["path/to/image.jpeg"]        │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Card exibe:                                                           │
│  ┌────────────────┐                                                    │
│  │   [thumbnail]  │                                                    │
│  │                │                                                    │
│  │ "2026 vai ser  │ ← Texto correto!                                   │
│  │  o ano em que..."│                                                  │
│  └────────────────┘                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

## Bonus: Limpar HTML do scriptSegment

O `scriptSegment` contém HTML (`<p>2026 vai ser...</p>`). Vamos também remover as tags para exibir apenas o texto limpo nos cards.

```typescript
// Helper para extrair texto puro de HTML
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// No card:
<p>{stripHtml(shot.scriptSegment) || 'Sem texto'}</p>
```

## Resultado Esperado

- Cards da Shotlist exibirão o **texto do roteiro** em vez do JSON bruto
- Imagens de referência serão carregadas corretamente
- Badges de seção (Gancho, Setup, etc.) aparecerão
- Sistema continuará funcionando com dados antigos (strings simples) e novos (JSON strings)
