
# Plano: Aplicar Padrão Mobile-First em Todas as Páginas

## Objetivo

Substituir o uso da classe `container` do Tailwind pelo padrão `max-w-2xl mx-auto px-4` em todas as páginas restantes, garantindo layout mobile-first e suporte às safe areas do iOS.

## Páginas a Corrigir

| # | Página | Alterações Necessárias |
|---|--------|------------------------|
| 1 | `TermsOfUse.tsx` | Header + Content + Safe area top |
| 2 | `PrivacyPolicy.tsx` | Header + Content + Safe area top |
| 3 | `SendSuggestions.tsx` | Header + Content + Safe area top |
| 4 | `MyProgress.tsx` | Header + Content + Safe area top |
| 5 | `Help.tsx` | Header + Content + Safe area top |
| 6 | `DevTools.tsx` | Content + Safe area top |
| 7 | `Levels.tsx` | Substituir `container max-w-4xl` por `max-w-4xl` (já tem safe area) |
| 8 | `EditProfile.tsx` | Header + Content + Safe area top |
| 9 | `MyPlan.tsx` | Substituir `container` por `max-w-2xl` (já tem safe area) |
| 10 | `CalendarioEditorial.tsx` | Múltiplas seções (já tem safe area) |
| 11 | `Scripts.tsx` | Header + Content (já tem safe area) |

## Padrão a Aplicar

### Header (com safe area)
```typescript
<div className="border-b border-border bg-background">
  <div 
    className="max-w-2xl mx-auto px-4 py-4"
    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
  >
    {/* Conteúdo do header */}
  </div>
</div>
```

### Conteúdo Principal
```typescript
<div className="max-w-2xl mx-auto px-4 py-6">
  {/* Cards e conteúdo */}
</div>
```

### Para páginas com `max-w-4xl` (como Levels, CalendarioEditorial)
```typescript
<div className="max-w-4xl mx-auto px-4 py-4">
  {/* Conteúdo */}
</div>
```

## Alterações por Arquivo

### 1. `src/pages/TermsOfUse.tsx`
- Linha 12: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 22: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 2. `src/pages/PrivacyPolicy.tsx`
- Linha 12: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 22: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 3. `src/pages/SendSuggestions.tsx`
- Linha 36: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 46: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 4. `src/pages/MyProgress.tsx`
- Linha 30: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 40: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 5. `src/pages/Help.tsx`
- Linha 28: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 38: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 6. `src/pages/DevTools.tsx`
- Linha 148: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4` + safe area top

### 7. `src/pages/Levels.tsx`
- Linha 37: `container max-w-4xl mx-auto px-4` → `max-w-4xl mx-auto px-4`
- Linha 57: `container max-w-4xl mx-auto px-4` → `max-w-4xl mx-auto px-4`

### 8. `src/pages/EditProfile.tsx`
- Linha 129: `container mx-auto px-4` → `max-w-2xl mx-auto px-4` + safe area top
- Linha 145: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 9. `src/pages/MyPlan.tsx`
- Linha 99: `container mx-auto px-4` → `max-w-2xl mx-auto px-4`
- Linha 116: `container mx-auto p-4 max-w-2xl` → `max-w-2xl mx-auto px-4 py-4`

### 10. `src/pages/CalendarioEditorial.tsx`
- Linha 524: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`
- Linha 538: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`
- Linha 550: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`
- Linha 585: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`

### 11. `src/pages/Scripts.tsx`
- Linha 337: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`
- Linha 346: `container mx-auto px-4` → `max-w-6xl mx-auto px-4`

## Resumo das Mudanças

| Arquivo | Qtd. Alterações |
|---------|-----------------|
| TermsOfUse.tsx | 2 |
| PrivacyPolicy.tsx | 2 |
| SendSuggestions.tsx | 2 |
| MyProgress.tsx | 2 |
| Help.tsx | 2 |
| DevTools.tsx | 1 |
| Levels.tsx | 2 |
| EditProfile.tsx | 2 |
| MyPlan.tsx | 2 |
| CalendarioEditorial.tsx | 4 |
| Scripts.tsx | 2 |
| **Total** | **23 alterações em 11 arquivos** |

## Resultado Esperado

Após as alterações:
- Todas as páginas terão layout mobile-first consistente
- Sem overflow horizontal em nenhum dispositivo iOS
- Safe areas respeitadas (Dynamic Island, notch, home indicator)
- Experiência visual uniforme em todas as páginas do app
