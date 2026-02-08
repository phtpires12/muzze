
# Plano: Correção de Layout Mobile - Modo Visualização (ContentView)

## Diagnóstico do Problema

A página ContentView utiliza a classe `container` do Tailwind que foi configurada para desktops com `padding: "2rem"`. No mobile iOS, isso causa:

| Problema | Causa |
|----------|-------|
| Cards cortados lateralmente | `container` + `px-4` = padding excessivo |
| Overflow horizontal | `container` não respeita viewport mobile |
| Layout "desktop adaptado" | Uso de padrão não mobile-first |

## Comparação de Padrões

```text
❌ ContentView (atual):
   container mx-auto px-4 → Padding conflitante

✅ Profile.tsx (correto):
   max-w-2xl mx-auto px-4 → Mobile-first

✅ Index.tsx (correto):
   px-6 direto → Mobile-first
```

## Solução Proposta

Substituir o uso de `container` por padrões mobile-first em toda a página ContentView:

### 1. Header (linha 357-374)

```typescript
// De:
<div className="container mx-auto px-4 py-4">

// Para:
<div className="max-w-2xl mx-auto px-4 py-4">
```

### 2. Área de Conteúdo Principal (linha 377)

```typescript
// De:
<div className="container mx-auto px-4 py-6 pb-32 max-w-2xl overflow-x-hidden">

// Para:
<div className="w-full max-w-2xl mx-auto px-4 py-6 pb-32">
```

Note: Remover `overflow-x-hidden` pois é um patch que esconde sintomas, não resolve a causa.

### 3. Botão CTA Fixo (linha 602-615)

```typescript
// De:
<div className="container mx-auto max-w-2xl">

// Para:
<div className="max-w-2xl mx-auto px-4">
```

### 4. Adicionar Proteção de Largura no Card Principal

Para garantir que o conteúdo dentro dos Cards não extrapole:

```typescript
// CardContent já tem break-words overflow-hidden, mas adicionar:
<Card className="mb-6 w-full overflow-hidden">
```

### 5. Proteção Extra de Safe Areas Laterais

Adicionar CSS para garantir respeito às safe areas laterais do iOS:

```css
/* Em src/index.css - já existe para top/bottom, adicionar para left/right */
.safe-area-x {
  padding-left: calc(env(safe-area-inset-left, 0px) + 1rem);
  padding-right: calc(env(safe-area-inset-right, 0px) + 1rem);
}
```

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/ContentView.tsx` | Substituir `container` por `max-w-2xl mx-auto`, adicionar `w-full overflow-hidden` nos Cards |
| `src/index.css` | Adicionar classe utilitária `.safe-area-x` |

## Alterações Detalhadas em ContentView.tsx

### Linha 357-361 (Header)
```typescript
<div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
  <div 
    className="max-w-2xl mx-auto px-4 py-4"
    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
  >
```

### Linha 376-377 (Conteúdo Principal)
```typescript
<ScrollArea className="h-[calc(100vh-80px)]">
  <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-32">
```

### Linha 390 (Card Principal)
```typescript
<Card className="mb-6 w-full overflow-hidden" onClick={handleEditAttempt}>
```

### Linha 512 (Card de Roteiro)
```typescript
<Card className="mb-6 w-full overflow-hidden" onClick={handleEditAttempt}>
```

### Linha 548 (Card de Shot List)
```typescript
<Card className="mb-6 w-full overflow-hidden" onClick={handleEditAttempt}>
```

### Linha 602-606 (CTA Fixo)
```typescript
<div 
  className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
>
  <div className="max-w-2xl mx-auto">
```

## Resultado Esperado

| Critério | Antes | Depois |
|----------|-------|--------|
| Conteúdo cabe na tela | ❌ | ✅ |
| Respeita safe areas | Parcial | ✅ Completo |
| iPhones pequenos | ❌ Corta | ✅ Cabe |
| iPhones com Dynamic Island | ⚠️ | ✅ |
| Scroll horizontal | Pode ter | ✅ Nunca |
| Layout mobile-first | ❌ | ✅ |

## Teste de Validação

Após implementação, verificar em:
1. iPhone SE (320px width)
2. iPhone 13/14 (390px width)
3. iPhone 14 Pro Max com Dynamic Island (430px width)
4. Orientação portrait e landscape
