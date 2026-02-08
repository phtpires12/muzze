
# Plano: Recap de Progresso do Usuário (Spotify Wrapped-style)

## Visão Geral

Implementar uma funcionalidade de "recap" inspirada no Spotify Wrapped que consolida o progresso do usuário em períodos de 30, 60, 90 dias e eventualmente anual. O recap aparecerá como uma seção especial na página Stats, com experiência imersiva de múltiplas telas/slides.

## Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                        BANCO DE DADOS                        │
├─────────────────────────────────────────────────────────────┤
│  user_recaps (nova tabela)                                   │
│  ├── id, user_id, period_type, period_start, period_end     │
│  ├── total_minutes, goal_minutes, days_active               │
│  ├── followers_count, had_viral (inputs manuais)            │
│  ├── viewed_at, created_at                                  │
│  └── computed_stats (jsonb: breakdown por stage, etc)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│  Stats.tsx                                                   │
│  └── RecapNotificationCard (novo componente)                 │
│      ├── Badge "Novo" se não visualizado                     │
│      └── Clique abre RecapFlow                               │
│                                                              │
│  RecapFlow.tsx (nova página/modal fullscreen)                │
│  ├── Slide 1: Abertura ("Seu recap chegou!")                 │
│  ├── Slide 2: Perguntas (seguidores + viralização)           │
│  ├── Slides 3-6: Dados objetivos                             │
│  │   ├── Tempo total criando                                 │
│  │   ├── Meta semanal vs realizado                           │
│  │   ├── Comparação com período anterior                     │
│  │   └── Destaques (melhor dia, etapa favorita)              │
│  └── Slide Final: Celebração + compartilhar                  │
└─────────────────────────────────────────────────────────────┘
```

## Fase 1: Estrutura do Banco de Dados

### Nova tabela: `user_recaps`

```sql
CREATE TABLE public.user_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período do recap
  period_type TEXT NOT NULL CHECK (period_type IN ('30d', '60d', '90d', '180d', '365d')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Dados calculados automaticamente
  total_minutes INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL DEFAULT 0,
  avg_daily_minutes NUMERIC(8,2) DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  
  -- Inputs manuais do usuário
  followers_count INTEGER,
  had_viral BOOLEAN,
  
  -- Dados computados (breakdown detalhado)
  computed_stats JSONB DEFAULT '{}',
  -- Exemplo: { 
  --   stageBreakdown: { ideation: 120, script: 300, ... },
  --   bestDay: "2026-01-15",
  --   bestDayMinutes: 180,
  --   weeklyGoalHitCount: 3,
  --   comparisonWithPrevious: { minutesDiff: +500, percentChange: +25 }
  -- }
  
  -- Status e timestamps
  is_eligible BOOLEAN DEFAULT TRUE, -- >= 3 dias ativos
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, period_type, period_end)
);

-- RLS Policies
ALTER TABLE public.user_recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recaps"
  ON public.user_recaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recaps"
  ON public.user_recaps FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_user_recaps_user_id ON public.user_recaps(user_id);
CREATE INDEX idx_user_recaps_viewed ON public.user_recaps(user_id, viewed_at);
```

## Fase 2: Lógica de Geração de Recaps

### Edge Function ou Cron Job: `generate-recaps`

A cada dia (via cron), verificar usuários elegíveis:

```typescript
// Pseudocódigo
async function generateRecapsForUser(userId: string) {
  const today = new Date();
  
  // Verificar se já passou 30 dias desde o primeiro uso
  const firstSession = await getFirstSessionDate(userId);
  if (!firstSession) return;
  
  const daysSinceStart = differenceInDays(today, firstSession);
  
  // Gerar recap de 30 dias
  if (daysSinceStart >= 30) {
    const existingRecap = await getRecap(userId, '30d', today);
    if (!existingRecap) {
      const stats = await computeRecapStats(userId, 30);
      if (stats.daysActive >= 3) {
        await createRecap(userId, '30d', stats);
      }
    }
  }
  
  // Gerar recap de 60, 90, etc.
  // ...
}
```

### Hook: `useRecaps`

```typescript
// src/hooks/useRecaps.ts
export const useRecaps = () => {
  const [availableRecaps, setAvailableRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableRecaps();
  }, []);

  const fetchAvailableRecaps = async () => {
    const { data } = await supabase
      .from('user_recaps')
      .select('*')
      .eq('user_id', userId)
      .eq('is_eligible', true)
      .order('period_end', { ascending: false });
    
    setAvailableRecaps(data || []);
    setLoading(false);
  };

  const markAsViewed = async (recapId: string) => {
    await supabase
      .from('user_recaps')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', recapId);
  };

  const saveUserInputs = async (recapId: string, followers: number, hadViral: boolean) => {
    await supabase
      .from('user_recaps')
      .update({ followers_count: followers, had_viral: hadViral })
      .eq('id', recapId);
  };

  return { availableRecaps, loading, markAsViewed, saveUserInputs, refetch: fetchAvailableRecaps };
};
```

## Fase 3: Componentes de UI

### 3.1 RecapNotificationCard (Stats.tsx)

Novo card que aparece logo abaixo do header na página Stats:

```typescript
// src/components/stats/RecapNotificationCard.tsx
interface RecapNotificationCardProps {
  recap: Recap;
  onClick: () => void;
}

export const RecapNotificationCard = ({ recap, onClick }: RecapNotificationCardProps) => {
  const isNew = !recap.viewed_at;
  const periodLabel = getPeriodLabel(recap.period_type);
  
  return (
    <Card 
      onClick={onClick}
      className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-2xl">📦</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              Seu recap {periodLabel} chegou!
            </h3>
            {isNew && (
              <Badge variant="default" className="bg-primary text-xs">
                Novo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Veja sua evolução dos últimos {recap.period_type.replace('d', '')} dias
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
};
```

### 3.2 RecapFlow (Experiência Imersiva)

Nova página fullscreen com slides estilo Spotify Wrapped:

```typescript
// src/pages/Recap.tsx (ou modal fullscreen)
const RecapFlow = () => {
  const { recapId } = useParams();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userInputs, setUserInputs] = useState({ followers: 0, hadViral: null });
  
  const slides = [
    // Slide 0: Abertura
    <RecapOpeningSlide />,
    
    // Slide 1: Perguntas
    <RecapQuestionsSlide 
      onSubmit={(followers, hadViral) => {
        setUserInputs({ followers, hadViral });
        nextSlide();
      }}
    />,
    
    // Slide 2: Tempo Total
    <RecapTotalTimeSlide totalMinutes={recap.total_minutes} />,
    
    // Slide 3: Meta vs Realizado
    <RecapGoalSlide 
      weeksHit={recap.computed_stats.weeklyGoalHitCount}
      totalWeeks={4}
    />,
    
    // Slide 4: Comparação
    <RecapComparisonSlide 
      current={recap.total_minutes}
      previous={recap.computed_stats.previousPeriodMinutes}
    />,
    
    // Slide 5: Destaques
    <RecapHighlightsSlide 
      bestDay={recap.computed_stats.bestDay}
      favoriteStage={recap.computed_stats.favoriteStage}
    />,
    
    // Slide 6: Encerramento
    <RecapClosingSlide 
      onShare={() => handleShare()}
      onClose={() => navigate('/stats')}
    />,
  ];
  
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="h-full"
        >
          {slides[currentSlide]}
        </motion.div>
      </AnimatePresence>
      
      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <span 
            key={i}
            className={cn(
              "w-2 h-2 rounded-full",
              i === currentSlide ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3.3 Slides Individuais

Cada slide terá:
- Animações de entrada com Framer Motion
- Visual impactante com gradientes
- Números grandes e legíveis
- Tom celebratório e motivador

```typescript
// Exemplo: RecapTotalTimeSlide
const RecapTotalTimeSlide = ({ totalMinutes }: { totalMinutes: number }) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-8xl mb-4"
      >
        ⏱️
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl text-muted-foreground mb-4"
      >
        Nos últimos 30 dias, você criou por
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="text-6xl font-bold text-primary"
      >
        {hours}h {mins}min
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-lg text-muted-foreground mt-6"
      >
        Isso é mais do que 90% dos criadores! 🔥
      </motion.p>
      
      <Button 
        onClick={() => nextSlide()}
        className="mt-8"
        size="lg"
      >
        Continuar
      </Button>
    </div>
  );
};
```

## Fase 4: Integração na Stats

Modificar `src/pages/Stats.tsx` para incluir a seção de recaps:

```typescript
// Em Stats.tsx, adicionar após o header:
{availableRecaps.length > 0 && (
  <section className="px-4 py-4 sm:px-8">
    <div className="max-w-6xl mx-auto space-y-3">
      {availableRecaps.map(recap => (
        <RecapNotificationCard 
          key={recap.id}
          recap={recap}
          onClick={() => navigate(`/recap/${recap.id}`)}
        />
      ))}
    </div>
  </section>
)}
```

## Fase 5: Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useRecaps.ts` | Criar | Hook para buscar e gerenciar recaps |
| `src/components/stats/RecapNotificationCard.tsx` | Criar | Card de notificação de recap disponível |
| `src/pages/Recap.tsx` | Criar | Página fullscreen da experiência de recap |
| `src/components/recap/RecapOpeningSlide.tsx` | Criar | Slide de abertura |
| `src/components/recap/RecapQuestionsSlide.tsx` | Criar | Slide com perguntas (seguidores, viral) |
| `src/components/recap/RecapTotalTimeSlide.tsx` | Criar | Slide de tempo total |
| `src/components/recap/RecapGoalSlide.tsx` | Criar | Slide de metas cumpridas |
| `src/components/recap/RecapComparisonSlide.tsx` | Criar | Slide de comparação |
| `src/components/recap/RecapHighlightsSlide.tsx` | Criar | Slide de destaques |
| `src/components/recap/RecapClosingSlide.tsx` | Criar | Slide de encerramento |
| `src/pages/Stats.tsx` | Modificar | Adicionar seção de recaps |
| `src/App.tsx` | Modificar | Adicionar rota `/recap/:id` |
| `supabase/functions/generate-recaps/index.ts` | Criar | Edge function para gerar recaps |
| Migration SQL | Criar | Tabela `user_recaps` |

## Fase 6: Fluxo de Dados Completo

```text
1. Cron Job (diário, 00:00 UTC)
   └── generate-recaps edge function
       └── Para cada usuário ativo:
           ├── Verificar elegibilidade (>=3 dias ativos)
           ├── Calcular stats do período
           └── Inserir registro em user_recaps

2. Usuário abre Stats.tsx
   └── useRecaps() busca recaps disponíveis
       └── Filtra por viewed_at = null para badge "Novo"

3. Usuário clica no RecapNotificationCard
   └── Navega para /recap/:id
       └── RecapFlow carrega dados do recap

4. Usuário completa o flow
   ├── Slide de perguntas salva followers + viral
   ├── markAsViewed() atualiza viewed_at
   └── Navega de volta para /stats
```

## Cronograma Sugerido

| Fase | Estimativa | Descrição |
|------|-----------|-----------|
| 1 | 1 hora | Criar tabela e migrations |
| 2 | 2 horas | Edge function de geração |
| 3 | 4 horas | Componentes de UI (slides) |
| 4 | 1 hora | Integração em Stats |
| 5 | 1 hora | Testes e ajustes |

**Total estimado: ~9 horas de desenvolvimento**

## Considerações Técnicas

1. **Performance**: Os recaps são pré-computados (não calculados em tempo real)
2. **Escalabilidade**: Cron job processa em batch, não impacta UX
3. **Privacidade**: Dados de seguidores/viral nunca são expostos publicamente
4. **Histórico**: Recaps antigos permanecem acessíveis para comparação futura
5. **Mobile-first**: Slides otimizados para viewport mobile

## Resultado Esperado

- Usuário vê card de recap na Stats após 30 dias de uso
- Experiência imersiva estilo Spotify Wrapped ao clicar
- Perguntas de engajamento salvam histórico longitudinal
- Tom celebratório que recompensa consistência
- Possibilidade de compartilhar resultados nas redes
