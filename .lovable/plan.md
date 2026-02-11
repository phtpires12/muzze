
# Reconstruir tela de Signup (Screen21Signup) no padrao visual do onboarding

## Problema

A tela de criacao de conta (Screen21Signup) usa um layout generico com `Card` centralizado, icone `UserPlus` em circulo roxo, e fundo `bg-background` padrao. Isso destoa completamente das outras telas do onboarding que usam: fundo violet-50/dark:bg-background, header com back button + GradientProgressBar, titulos alinhados a esquerda, animacoes framer-motion, e botao gradient-pill.

## Mudancas

### Arquivo: `src/components/onboarding/screens/phase6/Screen21Signup.tsx`

Reconstruir o layout para seguir o padrao das telas de questionario (ex: Screen13CreationTime, Screen12DailyTime):

1. **Layout raiz**: trocar de `div.space-y-8` para `div.min-h-[100dvh].bg-violet-50.dark:bg-background.flex.flex-col`

2. **Header**: adicionar header com back button (ChevronLeft) + GradientProgressBar, igual as outras telas. Isso requer adicionar props `onBack` e `progress` ao componente.

3. **Titulo**: mover para fora do Card, alinhado a esquerda, com framer-motion fade-in. Remover o icone UserPlus em circulo. Texto: "Crie sua conta" (titulo bold) + subtitulo muted.

4. **Social login**: mover para fora do Card tambem, botoes Google/Apple com estilo igual ao que ja existe mas sem wrapper de Card.

5. **Separador "ou continue com email"**: manter entre social e form.

6. **Form de email/senha**: sem Card wrapper, inputs com estilo igual ao padrao (h-12, border violet).

7. **Botao de submit**: trocar de `Button` padrao para `variant="gradient-pill"` com `size="lg"`, fixo no bottom da tela (mesmo padrao do "Continuar" das outras telas).

8. **Link "Ja tenho uma conta"**: manter como texto abaixo do form, nao como Button ghost.

9. **Termos**: manter texto xs no bottom.

10. **Animacoes**: cada secao com `motion.div` staggered (delay 0, 0.1, 0.2).

### Arquivo: `src/pages/NewOnboarding.tsx`

Atualizar a renderizacao do Screen21Signup (phase 2, screen 0) para:
- Renderizar fora do OnboardingLayout (como todas as outras telas fazem)
- Passar `onBack` e `progress` como props
- Incluir o Developer Badge

### Arquivo: `src/pages/Auth.tsx`

Reconstruir para o mesmo padrao visual:
- Fundo violet-50/dark:bg-background
- Logo Muzze no topo (folha gradiente, nao o logo completo)
- Titulo "Bem-vindo de volta" alinhado a esquerda
- Social login buttons
- Form sem Card wrapper
- Link "Esqueci minha senha" inline
- Botao gradient-pill
- Link "Nao tem conta? Criar conta" no bottom
- Tela de reset password tambem atualizada no mesmo estilo

## Estrutura visual final (ambas as telas)

```text
+----------------------------------+
| [<] [===gradient progress===]    |  <- so no signup (onboarding)
|                                  |
| Crie sua conta                   |  <- titulo bold, esquerda
| Voce esta a poucos passos...     |  <- subtitulo muted
|                                  |
| [G Continuar com Google     ]    |  <- botoes outline h-12
| [  Continuar com Apple      ]    |
|                                  |
| ---- ou continue com email ----  |
|                                  |
| Email                            |
| [seu@email.com              ]    |
| Senha                            |
| [Minimo 6 caracteres     [o]]   |
|                                  |
| Termos de uso e privacidade      |
|                                  |
| Ja tem uma conta? Entrar         |
|                                  |
| [====Criar minha conta======]    |  <- gradient-pill, bottom
+----------------------------------+
```

## Props adicionadas ao Screen21Signup

```typescript
interface Screen21SignupProps {
  onSuccess: () => void;
  onBack: () => void;    // novo
  progress: number;      // novo
}
```
