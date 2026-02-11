

# Ajustes de layout e logo no Paywall

## Mudancas no arquivo `src/components/onboarding/screens/phase6/Screen25Paywall.tsx`

### 1. Adicionar logo da Muzze
- Copiar a imagem `user-uploads://2-3.png` para `src/assets/paywall/muzze-leaf-gradient.png`
- Importar e exibir a logo centralizada entre o link "Restaurar compra" e o titulo, com tamanho pequeno (~40px)

### 2. Aumentar margem negativa no mockup
- Trocar `-mt-6` por `-mt-16` (ou valor similar) no container das imagens para compensar o padding superior grande das imagens de mockup
- Isso vai "puxar" o iPhone para mais perto do titulo, como na referencia

### 3. Garantir que tudo cabe na tela sem scroll
- Reduzir espacamentos entre elementos:
  - `mt-4 mb-6` do titulo para `mt-1 mb-1` (titulo quase encostando no mockup)
  - `space-y-3 pt-4` do bottom CTA para `space-y-2 pt-2`
  - `py-6` do container principal para `py-4`
- O container flex-col com `min-h-[100dvh]` ja garante distribuicao vertical; o mockup ocupa o `flex-1` restante

### Estrutura visual final:
```text
+----------------------------------+
|              Restaurar compra    |
|          [logo folha ~40px]      |
| Experimente a Muzze              |
|    gratuitamente.                |
|      +--------------------+      |
|      |   [iPhone Mockup]  |      |  <- margem negativa grande
|      |   bem proximo ao   |      |     para compensar padding
|      |   titulo acima     |      |     interno das imagens
|      +--------------------+      |
| Sem cobranca agora               |
| [==Experimente por R$0.00===]    |
| Depois R$298,80/ano (R$24,90/mes)|
+----------------------------------+
```

Tudo visivel sem scroll em telas de iPhone padrao (375x812 e similares).
