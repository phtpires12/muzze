

## Celebracao Reativa de Upgrade de Plano

### Cenario atual

Hoje existe uma pagina estatica `/paywall/success` que so aparece quando o usuario navega manualmente ate ela. Nao ha deteccao automatica de mudanca de plano.

### O que sera criado

Um sistema que **detecta automaticamente** quando o plano do usuario muda (de `free` para `pro` ou `studio`, ou de `pro` para `studio`) e exibe uma celebracao em multiplas telas -- independente de como o upgrade aconteceu.

### Gatilhos cobertos

1. **Admin promove via DevTools** -- O PlanContext faz polling/realtime e detecta que `plan_type` mudou
2. **Usuario restaura compra** -- O webhook Zouti atualiza o banco, e na proxima checagem o app detecta
3. **Compra nova via Paywall** -- Fluxo existente, agora tambem reativo

### Como vai funcionar

```text
+-------------------+     +------------------+     +---------------------+
| Banco: plan_type  | --> | PlanContext       | --> | Detecta mudanca     |
| muda (qualquer    |     | (ja carrega o     |     | free->pro, pro->    |
| origem)           |     |  plano do user)   |     | studio, etc.        |
+-------------------+     +------------------+     +---------------------+
                                                            |
                                                            v
                                                   +---------------------+
                                                   | Mostra celebracao   |
                                                   | multi-telas como    |
                                                   | overlay global      |
                                                   +---------------------+
```

### Detalhes tecnicos

**1. Hook `useUpgradeDetector` (novo arquivo: `src/hooks/useUpgradeDetector.ts`)**

- Armazena o `plan_type` anterior em `useRef`
- A cada vez que `PlanContext.planType` muda, compara com o anterior
- Se detecta upgrade (free->pro, free->studio, pro->studio), dispara a celebracao
- Usa Supabase Realtime na tabela `profiles` para receber mudancas instantaneamente (sem polling)
- Persiste em `sessionStorage` um flag `upgrade_celebrated_<planType>` para nao repetir na mesma sessao

**2. Habilitar Realtime na tabela `profiles` (migration SQL)**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

Isso permite que o PlanContext receba mudancas em tempo real quando um admin ou webhook atualiza o `plan_type`.

**3. Componente `UpgradeCelebration` (novo: `src/components/upgrade/UpgradeCelebration.tsx`)**

Overlay global (estilo do sistema de celebracoes existente) com 4 telas em sequencia:

- **Tela 1 - Boas-vindas**: "Parabens, agora voce e Pro!" com confetti e logo animado. Diferencia Pro vs Studio no titulo.
- **Tela 2 - Conteudos ilimitados**: Icone grande + texto curto sobre nao ter mais limite semanal.
- **Tela 3 - Recursos avancados**: Planejamento futuro, colaboradores, workspaces. Conteudo diferenciado por plano.
- **Tela 4 - Proximos passos**: 3 sugestoes + botao "Comecar a criar" que fecha o overlay.

Cada tela tera:
- Dots de progresso no topo
- Animacao fade/slide com framer-motion
- Botao "Continuar" / "Comecar a criar" (ultima tela)

**4. Slides internos (novo: `src/components/upgrade/UpgradeCelebrationSlides.tsx`)**

Componentes para cada slide, recebendo `planType` como prop para personalizar conteudo:
- `UpgradeWelcomeSlide` -- confetti + parabens
- `UpgradeUnlimitedSlide` -- conteudos ilimitados  
- `UpgradeFeaturesSlide` -- recursos (diferente pra Pro vs Studio)
- `UpgradeNextStepsSlide` -- CTA final

**5. Integracao no `App.tsx`**

Renderizar `UpgradeCelebration` como overlay global dentro do `RootLayout`, ao lado do `GlobalCelebrations` e `LevelUpModal` ja existentes.

**6. Atualizar PlanContext para reagir ao Realtime**

Adicionar um listener de Realtime na tabela `profiles` filtrado pelo `user_id` atual, que chama `refetchProfile()` quando detecta update. Isso garante que mudancas feitas por admin ou webhook sejam captadas instantaneamente.

**7. Remover/redirecionar pagina estatica `/paywall/success`**

A rota `/paywall/success` passara a simplesmente redirecionar para `/` -- a celebracao sera disparada automaticamente pelo detector de upgrade, sem precisar de uma rota dedicada.

### Nenhuma mudanca na logica de planos

O sistema apenas observa mudancas no `plan_type` existente. Nao altera como planos sao atribuidos (admin, webhook ou qualquer outra forma).

