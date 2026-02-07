

# Plano 4 de 5: Reformular Header e Botão Voltar

## Contexto

O header da Mesa de Edição não segue o padrão visual das outras páginas de Session (ShotListRecord e ShotListReview). Isso cria inconsistência na experiência do usuário.

## Análise Comparativa

### Padrão Atual (ShotListRecord/ShotListReview)

```text
┌──────────────────────────────────────────────────────────────┐
│  [←]     Gravação                              [PDF] [●]     │
│          Nome do roteiro                                     │
└──────────────────────────────────────────────────────────────┘
```

- **Botão Voltar**: `variant="ghost"` + `size="icon"` (apenas ícone `ArrowLeft`)
- **Título**: `text-lg font-bold text-foreground` (sem ícone decorativo)
- **Subtítulo**: `text-xs text-muted-foreground truncate`

### EditingWorkspace Atual (inconsistente)

```text
┌──────────────────────────────────────────────────────────────┐
│  [< 🎥 Gravação]     🎬 Mesa de Edição                       │
│                      Nome do roteiro                         │
└──────────────────────────────────────────────────────────────┘
```

- Botão voltar tem ícone `ChevronLeft` + ícone `Video` + texto
- Título tem ícone `Film` inline dentro do `h1`
- `size="sm"` em vez de `size="icon"`

## Solução

Reformular o header para seguir exatamente o padrão das outras páginas:

```text
┌──────────────────────────────────────────────────────────────┐
│  [←]     Mesa de Edição                                      │
│          Nome do roteiro                                     │
└──────────────────────────────────────────────────────────────┘
```

## Alterações Técnicas

### 1. Atualizar imports

Substituir `ChevronLeft` por `ArrowLeft`:

```tsx
import { ArrowLeft, ExternalLink } from "lucide-react";
// Remover: Film, ChevronLeft, Video
```

### 2. Reformular o botão voltar

De:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleGoBack}
  className="gap-2"
>
  <ChevronLeft className="w-4 h-4" />
  <Video className="w-4 h-4 text-red-500" />
  <span className="hidden sm:inline text-xs">
    {prevStage('editing') ? getStageLabel(prevStage('editing')!) : 'Gravação'}
  </span>
</Button>
```

Para:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="shrink-0"
  onClick={handleGoBack}
  title="Voltar para Gravação"
>
  <ArrowLeft className="w-5 h-5" />
</Button>
```

### 3. Reformular o título

De:
```tsx
<h1 className="text-lg font-semibold text-foreground truncate flex items-center gap-2">
  <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />
  Mesa de Edição
</h1>
```

Para:
```tsx
<h1 className="text-lg font-bold text-foreground truncate">
  Mesa de Edição
</h1>
```

### 4. Ajustar container do header

De:
```tsx
<div className="flex items-center gap-3">
```

Para (manter consistência com outras páginas):
```tsx
<div className="flex items-center gap-3">
  <!-- Botão voltar -->
  <Button variant="ghost" size="icon" ... />
  
  <!-- Título e subtítulo -->
  <div className="flex-1 min-w-0">
    <h1>Mesa de Edição</h1>
    <p>{script.title}</p>
  </div>
</div>
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/EditingWorkspace.tsx` | Reformular header seguindo padrão visual |

## Resultado Esperado

O header da Mesa de Edição terá:
- Botão voltar simples com apenas ícone de seta (`ArrowLeft`)
- Título sem ícone decorativo, usando `font-bold` como as outras páginas
- Visual consistente com ShotListRecord e ShotListReview

## Comparação Visual Final

| Elemento | Antes | Depois |
|----------|-------|--------|
| Botão Voltar | `ChevronLeft` + `Video` + texto | `ArrowLeft` apenas |
| Tamanho Botão | `size="sm"` | `size="icon"` |
| Título | Com ícone `Film` inline | Texto puro |
| Fonte Título | `font-semibold` | `font-bold` |

---

## Próximos Problemas

| # | Problema | Status |
|---|----------|--------|
| 1 | Reposicionar Música acima do Shotlist | ✅ Concluído |
| 2 | Adicionar link de referência do roteiro | ✅ Concluído |
| 3 | Remover campo Notas de Edição | ✅ Concluído |
| 4 | Reformular header/botão voltar | ✅ Concluído |
| 5 | Bolinhas de progresso não funcionam | 📋 Pendente |

