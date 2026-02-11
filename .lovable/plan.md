
# Corrigir sobreposicao do mockup sobre "Sem cobranca agora"

## Problema
O mockup do iPhone (com `flex-1` e `-mt-16`) esta se expandindo e sobrepondo o texto "Sem cobranca agora" no rodape. O CTA tem `z-10` mas o fundo e transparente, entao o mockup aparece por baixo do texto visualmente.

## Solucao: hierarquia estrutural via layout

### Arquivo: `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

**1. Mockup em section propria com altura controlada**
- Envolver o bloco do mockup em uma section com `max-h-[55vh]` e `overflow-hidden`
- Adicionar `relative z-0` para garantir camada inferior
- Isso "corta" o mockup naturalmente na parte inferior, sem overlay

**2. Bottom CTA em section separada com fundo solido**
- Adicionar `bg-violet-50 dark:bg-background` ao container do CTA para criar fundo opaco que cobre qualquer parte do mockup que possa "vazar"
- Manter `relative z-10` ja existente
- Adicionar `pt-3` para separacao visual entre o corte do mockup e o texto

**3. Estrutura final**:
```text
<div h-[100dvh] flex flex-col overflow-hidden>
  <header>  Pular (Dev) | Restaurar compra  </header>
  <logo>    folha Muzze                      </logo>
  <title>   Experimente a Muzze...           </title>

  <!-- Section do mockup: altura limitada, overflow cortado -->
  <section flex-1 max-h-[55vh] overflow-hidden relative z-0>
    <AnimatePresence> mockup images </AnimatePresence>
  </section>

  <!-- Section do CTA: fundo solido, z-10, nunca sobreposta -->
  <section relative z-10 bg-violet-50 dark:bg-background pt-3>
    Sem cobranca agora
    [Experimente por R$0,00]
    Depois R$298,80/ano
  </section>
</div>
```

Nenhum `position: absolute` sera usado. O mockup sera cortado naturalmente pelo `overflow-hidden` da sua section, e o CTA tera fundo opaco garantindo que nunca seja visualmente sobreposto.
