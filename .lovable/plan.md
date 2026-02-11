

# Ajustar layout do Paywall: mover "Pular (Dev)" e garantir CTA acima do mockup

## Problema
O botao "Pular (Dev)" no rodape esta empurrando todos os elementos (CTA, texto de preco) para cima, fazendo o mockup do iPhone invadir o titulo "gratuitamente.". Alem disso, o badge "Admin" fixo no canto superior direito e redundante com o botao "Pular (Dev)".

## Mudancas

### 1. `src/pages/NewOnboarding.tsx` (linhas 520-538)
- Remover o bloco do Developer Badge (`fixed top-4 right-4`) que renderiza acima do Screen25Paywall. O botao "Pular (Dev)" dentro da propria tela ja cumpre essa funcao.

### 2. `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

- **Mover o botao "Pular (Dev)"** do rodape (apos o texto de preco) para o header, substituindo o badge Admin. Posicionar como um botao pequeno/link no canto superior direito, ao lado do "Restaurar compra".

- **Garantir z-index no bottom CTA**: adicionar `relative z-10` no container do bottom CTA para que fique sempre acima do mockup caso haja sobreposicao.

- **Estrutura do header atualizada**:
```text
[Pular (Dev)]          [Restaurar compra]
```
Ambos como links discretos no topo. O "Pular (Dev)" so aparece para devs/admins.

- **Bottom CTA simplificado** (sem o botao Pular):
```text
  Sem cobranca agora
  [Experimente por R$0,00]
  Depois R$298,80/ano (R$24,90/mes)
```

Isso libera espaco vertical no rodape, permitindo que o mockup e o titulo nao conflitem.
