
# Ajuste minimo: subir CTA do rodape com safe area

## Mudanca unica

No arquivo `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`, na Area 3 (linhas 107-125):

- Adicionar ao `<section>` do CTA um `style` com `paddingBottom` usando safe area e um `translateY(-12px)` para levantar o bloco inteiro levemente acima do home indicator.
- Remover o `paddingBottom` do container raiz (linha 41) ja que o footer cuida do seu proprio safe area agora.

### Antes (linha 107):
```tsx
<section className="flex-none relative z-10 bg-violet-50 dark:bg-background rounded-t-2xl space-y-2 pt-3 pb-1">
```

### Depois:
```tsx
<section
  className="flex-none relative z-10 bg-violet-50 dark:bg-background rounded-t-2xl space-y-2 pt-3"
  style={{
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
    transform: 'translateY(-12px)',
  }}
>
```

### Container raiz (linha 41):
Remover `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` do style do root, pois a Area 3 agora gerencia seu proprio safe area.

## O que NAO muda
- Tamanho do mockup (Area 2 intacta)
- Header e titulo (Area 1 intacta)
- Proporcoes gerais da tela
- Zero scroll (overflow-hidden + 100dvh mantidos)
