
# Reestruturar layout do Paywall com mockup absoluto e mascara no CTA

## Problema
O mockup usa `-mt-16` e `flex-1` que causa invasao no titulo e sobreposicao no texto "Sem cobranca agora". A estrutura atual nao isola corretamente as 3 areas.

## Mudancas em `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

### Nova estrutura de 3 areas

```text
<div h-[100dvh] overflow-hidden flex flex-col>
  style: paddingTop env(safe-area-inset-top), paddingBottom env(safe-area-inset-bottom)

  AREA 1 - Header + Titulo (flex-none)
  ├── Header: Pular (Dev) | Restaurar compra
  ├── Logo folha Muzze
  └── Titulo "Experimente a Muzze gratuitamente."
      (posicao exatamente igual, relative z-10 para ficar acima do mockup)

  AREA 2 - Mockup (flex-1 relative overflow-hidden)
  ├── Container: relative, overflow-hidden, min-h-0
  └── Mockup: position absolute, inset-x-0, top com ajuste,
      centralizado, max-h-full, width controlada
      z-0 para ficar abaixo do titulo e do CTA

  AREA 3 - CTA (flex-none)
  ├── Mascara/faixa com bg igual ao fundo (bg-violet-50 / dark:bg-background)
  │   relative z-10, rounded-t-2xl, pt-3
  ├── "Sem cobranca agora" (dentro da mascara, sempre visivel)
  ├── Botao "Experimente por R$0,00"
  └── Texto "Depois R$298,80/ano"
</div>
```

### Detalhes tecnicos

**Area 1 (Header + Titulo)** - sem mudancas visuais:
- Adicionar `relative z-10` no container do titulo para garantir que fique acima do mockup
- Remover `mb-0` e manter espacamento minimo
- `flex-none` (nao encolhe, nao cresce)

**Area 2 (Mockup)** - principal mudanca:
- Trocar de `flex items-center justify-center` para `relative overflow-hidden`
- Remover `-mt-16` do container
- O mockup passa a ser `absolute` dentro dessa area:
  - `position: absolute`
  - `left: 50%, transform: translateX(-50%)` para centralizar
  - `top: -10%` (ou valor similar) para puxar a imagem pra cima e compensar o padding interno do asset
  - `max-height: 110%` e `width: 280px / sm:320px`
- Isso garante que o mockup NUNCA empurre outros elementos, apenas ocupa o espaco disponivel

**Area 3 (CTA com mascara)**:
- Container com `relative z-10` e fundo solido opaco (`bg-violet-50 dark:bg-background`)
- Adicionar `rounded-t-2xl` para cantos arredondados no topo da mascara, criando separacao suave
- O fundo solido cobre qualquer parte do mockup que possa aparecer atras
- Texto "Sem cobranca agora" fica dentro, sempre legivel
- `flex-none` (nao encolhe)

### Safe areas
- Trocar a classe `safe-area-inset` por inline style com `paddingTop: env(safe-area-inset-top, 0px)` e `paddingBottom: env(safe-area-inset-bottom, 0px)` para garantir compatibilidade com Dynamic Island e home bar

### Resultado
- Titulo nunca coberto pelo mockup (z-10 vs z-0)
- Mockup grande e bonito, limitado ao espaco do meio via absolute + overflow-hidden
- "Sem cobranca agora" legivel gracas a mascara com fundo solido e z-10
- Zero scroll em qualquer iPhone (100dvh + overflow-hidden)
- Header e titulo na mesma posicao visual
