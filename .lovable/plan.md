
## Plano: Sistema de Retomada com Carrossel Integrado

### Resumo da Mudanca

Transformar o card estatico de "ultima atividade criativa" na pagina inicial em um carrossel inteligente com barra de progresso que alterna automaticamente entre tres opcoes de continuidade:

1. **Ultima atividade criativa** (existente)
2. **Conteudo proximo de expirar** (data de publicacao mais proxima)
3. **Conteudo paralisado ha mais tempo** (nao editado ha dias)

O pop-up de "conteudo travado" (StuckContentPopup) sera desativado e substituido por esse sistema integrado.

---

### Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────┐
│  Index.tsx (Pagina Inicial)                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ContinuityCarousel (novo componente)               │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  Barra de Progresso   ●●○  1/3                │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  Slide 1: Ultima atividade                    │ │   │
│  │  │  Slide 2: Proximo de expirar                  │ │   │
│  │  │  Slide 3: Paralisado ha mais tempo            │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  [Continuar criando →]                             │   │
│  │  ou iniciar nova sessao                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### Novos Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useContinuityOptions.ts` | Hook que busca as 3 opcoes de continuidade do banco |
| `src/components/home/ContinuityCarousel.tsx` | Componente do carrossel com barra de progresso |
| `src/components/home/ContinuitySlide.tsx` | Componente de cada slide individual |

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Index.tsx` | Substituir card estatico pelo ContinuityCarousel |
| `src/pages/Index.tsx` | Remover importacao/uso do StuckContentPopup |

---

### Estrutura de Dados do Hook

O novo hook `useContinuityOptions` retornara:

```typescript
interface ContinuityOption {
  id: string;
  type: 'recent' | 'expiring' | 'stalled';
  title: string;
  stage: SessionStage;
  subtitle: string;        // ex: "Etapa: Revisao"
  metadata: string;        // ex: "Ultima edicao: 02 de fev., 11:05"
  urgencyBadge?: {
    label: string;         // "3 dias para publicar" ou "Parado ha 7 dias"
    variant: 'warning' | 'urgent' | 'info';
  };
  scriptId: string;
}

interface UseContinuityOptionsReturn {
  options: ContinuityOption[];
  loading: boolean;
  refetch: () => void;
}
```

**Logica de busca:**

1. **Ultima atividade (recent):** Script com `updated_at` mais recente nos ultimos 7 dias
2. **Proximo de expirar (expiring):** Script com `publish_date` mais proximo (futuro) que ainda nao foi postado
3. **Paralisado (stalled):** Script em status de rascunho com `updated_at` mais antigo (ordenado por dias sem atualizacao)

---

### Visual do Carrossel

**Barra de progresso + indicadores:**
- Barra horizontal que preenche em 4 segundos
- Dots clicaveis para navegacao manual
- Contador "1/3", "2/3", etc.
- Pausa no hover/toque

**Cada slide mostra:**
- Badge de contexto colorido (tipo da sugestao)
- Titulo do conteudo (emoji + titulo)
- Subtitulo (etapa atual)
- Metadado (ultima edicao ou dias para publicar)

**Transicao:**
- Fade + slide horizontal suave (framer-motion)
- Duracao: 300ms

---

### Fluxo do Usuario

```text
Usuario abre o app
        ↓
useContinuityOptions busca 3 opcoes
        ↓
ContinuityCarousel renderiza
        ↓
   ┌────┴────┐
   ↓         ↓
Auto-play   Usuario clica dot
(4s cada)   ou arrasta
   ↓         ↓
   └────┬────┘
        ↓
Slide muda com animacao
        ↓
Usuario clica "Continuar criando"
        ↓
Navega para /session com scriptId correto
```

---

### Logica de Prioridade

Se houver apenas 1 ou 2 opcoes validas, o carrossel se adapta:
- **1 opcao:** Sem carrossel, mostra card estatico (comportamento atual)
- **2 opcoes:** Carrossel com 2 slides
- **3 opcoes:** Carrossel completo

---

### Badges de Contexto

| Tipo | Badge | Cor |
|------|-------|-----|
| recent | "Ultima atividade" | Violeta (primary) |
| expiring | "Publicar em X dias" | Laranja (warning) |
| stalled | "Parado ha X dias" | Amarelo (caution) |

---

### Secao Tecnica

**useContinuityOptions.ts - Queries:**

```typescript
// 1. Ultima atividade
const { data: recentScript } = await supabase
  .from('scripts')
  .select('id, title, status, updated_at')
  .eq('user_id', userId)
  .gte('updated_at', sevenDaysAgo)
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();

// 2. Proximo de expirar
const { data: expiringScript } = await supabase
  .from('scripts')
  .select('id, title, status, publish_date, updated_at')
  .eq('user_id', userId)
  .gte('publish_date', today)
  .neq('publish_status', 'postado')
  .order('publish_date', { ascending: true })
  .limit(1)
  .single();

// 3. Paralisado ha mais tempo
const { data: stalledScript } = await supabase
  .from('scripts')
  .select('id, title, status, updated_at')
  .eq('user_id', userId)
  .in('status', ['draft', 'draft_idea', 'review', 'recording', 'editing'])
  .lt('updated_at', fourteenDaysAgo)
  .order('updated_at', { ascending: true })
  .limit(1)
  .single();
```

**ContinuityCarousel.tsx - Autoplay:**

```typescript
const AUTOPLAY_INTERVAL = 4000; // 4 segundos
const [currentIndex, setCurrentIndex] = useState(0);
const [progress, setProgress] = useState(0);
const [isPaused, setIsPaused] = useState(false);

useEffect(() => {
  if (options.length <= 1 || isPaused) return;
  
  const progressInterval = setInterval(() => {
    setProgress(prev => Math.min(prev + (50 / AUTOPLAY_INTERVAL) * 100, 100));
  }, 50);
  
  const transitionInterval = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % options.length);
    setProgress(0);
  }, AUTOPLAY_INTERVAL);
  
  return () => {
    clearInterval(progressInterval);
    clearInterval(transitionInterval);
  };
}, [options.length, isPaused, currentIndex]);
```

---

### Impacto no StuckContentPopup

O componente `StuckContentPopup` e o hook `useStuckContent` continuarao existindo no codigo, mas nao serao mais chamados na Index.tsx. Isso permite:
- Rollback facil se necessario
- Reutilizacao em outras partes do app no futuro

---

### Ordem de Implementacao

1. Criar `src/hooks/useContinuityOptions.ts`
2. Criar `src/components/home/ContinuitySlide.tsx`
3. Criar `src/components/home/ContinuityCarousel.tsx`
4. Modificar `src/pages/Index.tsx` para usar o novo carrossel
5. Testar fluxo completo com diferentes cenarios de dados
