

## Plano: Substituir Imagem do Modo Escuro na Tela 13

### Objetivo

Substituir a imagem atual do cérebro usada no modo escuro (`brain-science-dark.png`) pela nova imagem enviada, que possui melhor contraste e legibilidade para fundos escuros.

---

### Situação Atual

| Modo | Arquivo | Status |
|------|---------|--------|
| Claro | `src/assets/onboarding/brain-science-light.png` | ✅ Manter |
| Escuro | `src/assets/onboarding/brain-science-dark.png` | 🔄 Substituir |

O componente `Screen11BehavioralScience.tsx` já está configurado para exibir imagens diferentes por tema:
- Modo claro: `dark:hidden` (visível apenas no light mode)
- Modo escuro: `hidden dark:block` (visível apenas no dark mode)

---

### Ação Necessária

| Ação | Origem | Destino |
|------|--------|---------|
| Copiar | `user-uploads://Ilustração_Brain_-_Dark.png` | `src/assets/onboarding/brain-science-dark.png` |

Isso sobrescreverá o arquivo existente, mantendo o mesmo nome e caminho. Como o componente já importa esse arquivo, nenhuma alteração de código é necessária.

---

### Verificação Visual

A nova imagem possui:
- Labels com cores mais vibrantes (coral, ciano-amarelo gradiente, azul)
- Texto branco com melhor contraste
- Cérebro colorido que se destaca melhor em fundos escuros

---

### Seção Técnica

**Por que apenas substituir o arquivo?**
- O componente já importa `brainScienceDark` de `@/assets/onboarding/brain-science-dark.png`
- Ao sobrescrever o arquivo com o mesmo nome, o Vite vai automaticamente usar a nova imagem
- Não é necessário alterar nenhum código

**Nenhuma alteração de código necessária** - apenas a substituição do asset.

