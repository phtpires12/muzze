

## Plano: Destacar a Ilustracao do Cerebro na Tela 13

### Objetivo
Ajustar o layout da Tela 13 (Screen11BehavioralScience) para que a ilustracao do cerebro seja o centro de atencao visual, reduzindo o tamanho do titulo e aumentando o tamanho da imagem.

---

### Mudancas Propostas

| Elemento | Valor Atual | Novo Valor |
|----------|-------------|------------|
| Titulo | `text-2xl` | `text-lg` ou `text-xl` |
| Imagem | `max-w-[200px]` | `max-w-[280px]` ou `max-w-[300px]` |

---

### Codigo Atualizado

**Linha 55 - Titulo:**
```tsx
// ANTES
className="text-2xl font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mt-2 mb-4"

// DEPOIS
className="text-lg font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mt-2 mb-4"
```

**Linhas 71 e 78 - Imagens:**
```tsx
// ANTES
className="w-full max-w-[200px] dark:hidden"
className="w-full max-w-[200px] hidden dark:block"

// DEPOIS
className="w-full max-w-[280px] dark:hidden"
className="w-full max-w-[280px] hidden dark:block"
```

---

### Hierarquia Visual Resultante

```text
+------------------------------------------+
|  <-                                      |
+------------------------------------------+
|                                          |
|   Aqui voce Cria Conteudo com base       |  <- MENOR (text-lg)
|   na Ciencia Comportamental.             |     Secundario
|                                          |
|         +------------------+             |
|         |                  |             |
|         |   [BRAIN IMG]    |             |  <- MAIOR (280px)
|         |                  |             |     Foco principal
|         +------------------+             |
|                                          |
+------------------------------------------+
|  [Cards scrollaveis]                     |
+------------------------------------------+
|  [Continuar]                             |
+------------------------------------------+
```

---

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/onboarding/screens/phase1/Screen11BehavioralScience.tsx` | **MODIFICAR** - Ajustar tamanhos |

---

### Secao Tecnica

**Alteracoes especificas:**

1. **Linha 55** - Reduzir titulo de `text-2xl` para `text-lg`
2. **Linha 71** - Aumentar imagem light de `max-w-[200px]` para `max-w-[280px]`
3. **Linha 78** - Aumentar imagem dark de `max-w-[200px]` para `max-w-[280px]`

**Por que 280px?**
- Aumenta significativamente o destaque visual (40% maior que 200px)
- Ainda deixa espaco lateral adequado em telas de 393px (iPhone 16 Pro)
- Mantem proporcao harmonica com os cards abaixo

