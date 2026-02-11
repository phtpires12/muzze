
# Corrigir "iPhone dentro de iPhone" no Paywall

## Problema
As imagens enviadas (mockup-home.png, mockup-calendar.png, etc.) ja contem o frame do iPhone embutido. O componente `PhoneMockup` adiciona um segundo frame por cima, resultando num iPhone dentro de outro iPhone.

## Solucao

### Arquivo: `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

1. **Remover o import e uso do `PhoneMockup`** -- as imagens ja tem o mockup embutido, entao basta exibi-las diretamente.

2. **Substituir o bloco do PhoneMockup** por um container simples com as imagens rotativas:
   - Container centralizado com `overflow-hidden`
   - Imagens exibidas diretamente com `AnimatePresence` crossfade (como ja esta)
   - Usar `object-contain` em vez de `object-cover` para mostrar a imagem inteira
   - Aplicar margem negativa no topo (`-mt-8` ou similar) para compensar o padding excessivo que as imagens tem na parte superior, fazendo com que preencham melhor o espaco disponivel

3. **Estrutura simplificada do bloco central**:
```text
<div className="flex-1 flex items-center justify-center min-h-0 -mt-6">
  <div className="relative w-[280px] sm:w-[320px] h-auto">
    <AnimatePresence mode="wait">
      <motion.img src={MOCKUP_IMAGES[currentIndex]} ... />
    </AnimatePresence>
  </div>
</div>
```

A imagem vai aparecer grande e centralizada, mostrando o iPhone que ja vem dentro dela, sem duplicacao de frames. O margin-top negativo compensa o padding superior das imagens para que fiquem visualmente maiores e preencham melhor a area central da tela.
