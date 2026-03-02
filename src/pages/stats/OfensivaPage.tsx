import { useState, useEffect, useRef } from "react";
import { useAppVisibility } from '@/core/hooks';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, ChevronLeft, ChevronRight, Snowflake, Gem, Info, TrendingUp, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday, getDaysInMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { MAX_STREAK_FREEZES, MAX_STREAK_BONUS_DAYS } from '@/core/services';
import { useProfileWithLevel } from '@/core/hooks';
import * as htmlToImage from 'html-to-image';
import { StreakShareCard } from "@/components/shared";
import FireIcon from "@/components/content/ofensiva/FireIcon";
import DayDetailDrawer, { DayProgress } from "@/components/content/ofensiva/DayDetailDrawer";
import { getDayKey, getDayBoundsUTC, getMonthStartKey, getMonthEndKey, dayKeyToLocalDate, getDayKeysInRange } from '@/core/utils';
import { ROUTES } from "@/routes/routes";


const Ofensiva = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, effectiveLevel, goalMinutes, freezeCost, refetch } = useProfileWithLevel();
  const isAppVisible = useAppVisibility();
  const cardRef = useRef<HTMLDivElement>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayProgressMap, setDayProgressMap] = useState<Map<string, { minutes: number }>>(new Map());
  const [freezeDays, setFreezeDays] = useState<Date[]>([]);
  const [freezesUsedThisMonth, setFreezesUsedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayProgress | null>(null);
  const [hasShownFreezeDialog, setHasShownFreezeDialog] = useState(false);
  const [freezePurchaseInfo, setFreezePurchaseInfo] = useState<{ newTotal: number; xpSpent: number; xpRemaining: number } | null>(null);

  useEffect(() => {
    fetchStreakData();
  }, []);

  // Só buscar dados do mês quando profile carregar (timezone correto)
  useEffect(() => {
    if (profile) {
      fetchMonthProgress();
      fetchFreezesUsedThisMonth();
    }
  }, [currentMonth, profile]);

  // Refetch dados quando o app fica visível novamente (ex: após usar timer)
  useEffect(() => {
    if (isAppVisible && profile) {
      fetchMonthProgress();
      fetchStreakData();
    }
  }, [isAppVisible]);

  const fetchStreakData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStreakCount(data.current_streak ?? 0);
      setLongestStreak(data.longest_streak ?? 0);
    }
    setLoading(false);
  };

  const fetchMonthProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userTimezone = profile?.timezone || 'America/Sao_Paulo';
    const monthStartKey = getMonthStartKey(currentMonth, userTimezone);
    const monthEndKey = getMonthEndKey(currentMonth, userTimezone);
    const { startUTC: monthStartUTC } = getDayBoundsUTC(monthStartKey, userTimezone);
    const { endUTC: monthEndUTC } = getDayBoundsUTC(monthEndKey, userTimezone);

    // Usar RPC para agregar no banco (evita limite de 1000 linhas)
    const { data: summary, error } = await supabase.rpc('get_monthly_stage_summary', {
      p_user_id: user.id,
      p_start_utc: monthStartUTC.toISOString(),
      p_end_utc: monthEndUTC.toISOString(),
      p_timezone: userTimezone,
    });

    if (error) {
      console.error('[Ofensiva] Erro ao buscar resumo mensal:', error);
      return;
    }

    const progressMap = new Map<string, { minutes: number }>();
    summary?.forEach((row: { day_key: string; total_minutes: number }) => {
      progressMap.set(row.day_key, { minutes: row.total_minutes });
    });

    console.log(`[Ofensiva] Progresso do mês (via RPC):`, Object.fromEntries(progressMap));
    setDayProgressMap(progressMap);
  };

  const fetchFreezesUsedThisMonth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userTimezone = profile?.timezone || 'America/Sao_Paulo';

    // Calcular bounds do mês na timezone do usuário usando utilitários centrais
    const monthStartKey = getMonthStartKey(currentMonth, userTimezone);
    const monthEndKey = getMonthEndKey(currentMonth, userTimezone);

    // Converter para UTC para queries
    const { startUTC: monthStartUTC } = getDayBoundsUTC(monthStartKey, userTimezone);
    const { endUTC: monthEndUTC } = getDayBoundsUTC(monthEndKey, userTimezone);

    const { data: freezeUsage } = await supabase
      .from('streak_freeze_usage')
      .select('used_at')
      .eq('user_id', user.id)
      .gte('used_at', monthStartUTC.toISOString())
      .lte('used_at', monthEndUTC.toISOString());

    setFreezesUsedThisMonth(freezeUsage?.length || 0);

    // Converter freeze dates para timezone do usuário usando getDayKey
    const freezeDates = freezeUsage?.map(f => {
      if (!f.used_at) return new Date();
      const freezeDate = new Date(f.used_at);
      const dayKey = getDayKey(freezeDate, userTimezone);
      return dayKeyToLocalDate(dayKey);
    }) || [];

    console.log(`[Ofensiva] Freezes usados este mês:`, freezeUsage?.length, freezeDates.map(d => format(d, 'yyyy-MM-dd')));
    setFreezeDays(freezeDates);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Não permitir navegar para meses futuros
    if (nextMonth.getMonth() <= new Date().getMonth() || nextMonth.getFullYear() < new Date().getFullYear()) {
      setCurrentMonth(nextMonth);
    }
  };

  const handleShare = async () => {
    const shareText = `🔥 Estou há ${streakCount} dia${streakCount !== 1 ? 's' : ''} criando sem parar na Muzze!\n\nMantenha sua consistência criativa: muzze.app`;

    if (!cardRef.current) {
      // Fallback para texto se card não existir
      if (navigator.share) {
        await navigator.share({ title: 'Minha Ofensiva na Muzze', text: shareText, url: 'https://muzze.app' });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copiado para a área de transferência!");
      }
      return;
    }

    setIsGeneratingImage(true);

    try {
      const blob = await htmlToImage.toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0A0A0A',
      });

      if (!blob) throw new Error('Falha ao gerar imagem');

      const file = new File([blob], 'minha-ofensiva-muzze.png', { type: 'image/png' });

      // Verificar se pode compartilhar arquivos (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Minha Ofensiva na Muzze',
        });
      } else if (navigator.share) {
        // Fallback: compartilhar só texto
        await navigator.share({
          title: 'Minha Ofensiva na Muzze',
          text: shareText,
          url: 'https://muzze.app'
        });
      } else {
        // Desktop: baixar imagem
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'minha-ofensiva-muzze.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Imagem salva!", {
          description: "Compartilhe nas suas redes sociais."
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
        // Fallback para texto
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success("Copiado para a área de transferência!");
        } catch {
          toast.error("Não foi possível compartilhar.");
        }
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleBuyFreeze = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const currentFreezes = profile.streak_freezes || 0;

    // Check limit before buying
    if (currentFreezes >= MAX_STREAK_FREEZES) {
      toast.error("Limite atingido", {
        description: `Você já tem o máximo de ${MAX_STREAK_FREEZES} bloqueios de ofensiva.`
      });
      return;
    }

    // Custo do freeze baseado na meta dinâmica do nível (agora vem do hook)
    const userXP = profile.xp_points || 0;

    if (userXP < freezeCost) {
      toast.error("XP insuficiente", {
        description: `Você precisa de ${freezeCost} XP para comprar um bloqueio.`
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        xp_points: userXP - freezeCost,
        streak_freezes: currentFreezes + 1
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error("Erro ao comprar bloqueio", {
        description: error.message
      });
      return;
    }

    // Refresh profile data without reloading
    await refetch();

    // Show dialog only on first purchase of this session
    if (!hasShownFreezeDialog) {
      setFreezePurchaseInfo({
        newTotal: currentFreezes + 1,
        xpSpent: freezeCost,
        xpRemaining: userXP - freezeCost,
      });
    }
  };

  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return "Comece sua jornada criativa hoje!";
    if (streak === 1) return "Ótimo começo! Continue amanhã.";
    if (streak < 7) return "Mantenha a sua ofensiva perfeita: faça uma lição todos os dias!";
    if (streak < 30) return `Incrível! ${streak} dias de criatividade!`;
    if (streak < 100) return `Você é imparável! ${streak} dias seguidos!`;
    return `Lendário! ${streak} dias de ofensiva!`;
  };

  const MILESTONES = [7, 14, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 1000];

  const getCurrentMilestones = (streak: number) => {
    let previous = 0;
    let next = MILESTONES[0];

    for (let i = 0; i < MILESTONES.length; i++) {
      if (streak >= MILESTONES[i]) {
        previous = MILESTONES[i];
        next = MILESTONES[i + 1] || previous + 100;
      } else {
        next = MILESTONES[i];
        break;
      }
    }

    const progress = previous === 0
      ? (streak / next) * 100
      : ((streak - previous) / (next - previous)) * 100;

    return { previous, next, progress: Math.min(progress, 100) };
  };

  const milestones = getCurrentMilestones(streakCount);

  const canGoNext = currentMonth.getMonth() < new Date().getMonth() ||
    currentMonth.getFullYear() < new Date().getFullYear();

  const daysInMonth = getDaysInMonth(currentMonth);

  // Meta dinâmica já vem do hook useProfileWithLevel

  // Calcular dias completos baseado no dayProgressMap
  const daysCompleted = Array.from(dayProgressMap.values()).filter(p => p.minutes >= goalMinutes).length;
  const percentComplete = (daysCompleted / daysInMonth) * 100;

  const monthBadge =
    percentComplete >= 80 ? "ÓTIMO" :
      percentComplete >= 50 ? "BOM" :
        percentComplete >= 30 ? "REGULAR" : "";

  // Criar grid do calendário
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.HOME)}
            className="rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>

          <h1 className="text-lg font-bold tracking-tight text-foreground">Ofensiva</h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="rounded-lg"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-0">
        {/* Hero Section - Contador de Streak */}
        <section className="px-4 py-10 text-center space-y-6">
          {/* Ícone de chama */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-6xl drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]">🔥</span>
            </div>

            {/* Badge do número */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-3 py-0.5 shadow-sm">
              <span className="text-xs font-bold text-foreground">{streakCount}</span>
            </div>
          </div>

          {/* Texto principal */}
          <div>
            <h2 className="text-5xl font-bold tracking-tight text-foreground mb-1">
              {streakCount}
            </h2>
            <p className="text-lg font-medium text-muted-foreground">
              {streakCount === 1 ? "dia de ofensiva" : "dias de ofensiva"}
            </p>
          </div>
        </section>

        {/* Card de Motivação - Seção Alternada */}
        <section className="bg-muted/30 px-4 py-6">
          <Card className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔥</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  {getMotivationalMessage(streakCount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dedique pelo menos {goalMinutes} minutos criando por dia para manter sua ofensiva.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Card de Bônus de XP Progressivo */}
        <section className="px-4 py-6">
          <Card className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-foreground">
                    +{streakCount}% de XP
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Bônus Ativo
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Cada dia de ofensiva = +1% de bônus em todo XP ganho
                </p>
                {streakCount < MAX_STREAK_BONUS_DAYS && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(streakCount / MAX_STREAK_BONUS_DAYS) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">
                      {streakCount}/{MAX_STREAK_BONUS_DAYS}
                    </span>
                  </div>
                )}
                {streakCount >= MAX_STREAK_BONUS_DAYS && (
                  <p className="text-xs font-medium text-primary">
                    🎉 Bônus máximo atingido! Você é lendário!
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Estatísticas do Mês - Seção Alternada */}
        <section className="bg-muted/30 px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-background border border-border rounded-xl text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🔥</span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{daysCompleted}</div>
              <div className="text-xs text-muted-foreground">Dias de prática</div>
            </Card>

            <Card className="p-4 bg-background border border-border rounded-xl text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Snowflake className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{freezesUsedThisMonth}</div>
              <div className="text-xs text-muted-foreground">Bloqueios utilizados</div>
            </Card>
          </div>
        </section>

        {/* Meta de Ofensiva */}
        <section className="px-4 py-6 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Meta de ofensiva</h2>

          <Card className="p-5 bg-background border border-border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              {/* Previous milestone */}
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{milestones.previous}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 mx-4">
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${milestones.progress}%` }}
                  />
                </div>
              </div>

              {/* Next milestone */}
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center">
                  <span className="text-muted-foreground font-bold text-sm">{milestones.next}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Faltam {milestones.next - streakCount} dias para atingir {milestones.next}
            </p>
          </Card>
        </section>

        {/* Calendário Visual - Seção Alternada */}
        <section className="bg-muted/30 px-4 py-6">
          <Card className="p-4 bg-background border border-border rounded-xl">
            {/* Header de navegação do mês */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousMonth}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-sm font-semibold text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                disabled={isSameMonth(currentMonth, new Date())}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Dias vazios antes do primeiro dia do mês */}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Dias do mês */}
              {monthDays.map(day => {
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const dayNum = String(day.getDate()).padStart(2, '0');
                const dayKey = `${year}-${month}-${dayNum}`;

                const dayNumber = format(day, 'd');
                const progress = dayProgressMap.get(dayKey);
                const minutes = progress?.minutes || 0;

                // Debug para dia 12
                if (dayKey === '2026-01-12') {
                  console.log(`[Ofensiva Render] Dia 12:`, {
                    dayKey,
                    progress,
                    minutes,
                    goalMinutes,
                    isComplete: minutes >= goalMinutes
                  });
                }

                // CORREÇÃO: Comparar freezes por dayKey extraído da mesma forma
                const userTimezone = profile?.timezone || 'America/Sao_Paulo';
                const freezeUsed = freezeDays.some(freezeDate => {
                  const fYear = freezeDate.getFullYear();
                  const fMonth = String(freezeDate.getMonth() + 1).padStart(2, '0');
                  const fDay = String(freezeDate.getDate()).padStart(2, '0');
                  const freezeDayKey = `${fYear}-${fMonth}-${fDay}`;
                  return freezeDayKey === dayKey;
                });

                const isDayFuture = isFuture(day) && !isToday(day);
                const isDayToday = isToday(day);

                const status: DayProgress['status'] =
                  freezeUsed ? 'freeze' :
                    minutes >= goalMinutes ? 'complete' :
                      minutes > 0 ? 'partial' : 'empty';

                const handleDayClick = () => {
                  if (!isDayFuture) {
                    setSelectedDay({
                      date: day,
                      minutes,
                      status
                    });
                  }
                };

                // Dia futuro - apenas número suave
                if (isDayFuture) {
                  return (
                    <div
                      key={day.toString()}
                      className="aspect-square flex flex-col items-center justify-center"
                    >
                      <span className="text-[10px] text-muted-foreground/30">{dayNumber}</span>
                    </div>
                  );
                }

                // Freeze usado - floco de neve
                if (freezeUsed) {
                  return (
                    <button
                      key={day.toString()}
                      onClick={handleDayClick}
                      className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors hover:bg-muted ${isDayToday ? 'ring-1 ring-cyan-500/50' : ''
                        }`}
                    >
                      <span className="text-lg opacity-70">❄️</span>
                      <span className="text-[10px] text-muted-foreground/50">{dayNumber}</span>
                    </button>
                  );
                }

                // Dia com/sem progresso - mostra FireIcon
                const isComplete = minutes >= goalMinutes;

                return (
                  <button
                    key={day.toString()}
                    onClick={handleDayClick}
                    className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors hover:bg-muted ${isDayToday ? 'ring-1 ring-primary/50' : ''
                      } ${isComplete ? 'bg-primary/5' : ''
                      }`}
                  >
                    <FireIcon
                      minutes={minutes}
                      goalMinutes={goalMinutes}
                      isToday={isDayToday}
                    />
                    <span className={`text-[10px] ${isComplete
                        ? 'text-primary'
                        : minutes > 0
                          ? 'text-amber-500/70'
                          : 'text-muted-foreground/40'
                      }`}>
                      {dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Proteja a sua Ofensiva (Loja) */}
        <section className="px-4 py-6 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Proteja a sua ofensiva</h2>

          {/* XP Balance */}
          <Card className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seu saldo de XP</p>
                  <p className="text-lg font-bold tracking-tight text-foreground">{profile?.xp_points || 0} XP</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Bloqueios disponíveis</p>
                <p className="text-lg font-bold tracking-tight text-cyan-500">
                  {profile?.streak_freezes || 0}
                  <span className="text-muted-foreground font-normal">/{MAX_STREAK_FREEZES}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Freeze Purchase Card */}
          <Card className="p-5 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-4">
              {/* Freeze icon */}
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Snowflake className="w-8 h-8 text-cyan-500" />
              </div>

              {/* Info and button */}
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground mb-1">Bloqueio de ofensiva</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Proteja sua ofensiva por 1 dia caso você não consiga cumprir sua meta
                </p>

                <Button
                  onClick={handleBuyFreeze}
                  disabled={
                    !profile ||
                    (profile.xp_points || 0) < freezeCost ||
                    (profile.streak_freezes || 0) >= MAX_STREAK_FREEZES
                  }
                  className="w-full rounded-lg font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>COMPRAR POR</span>
                    <Gem className="w-4 h-4" />
                    <span>{freezeCost}</span>
                  </div>
                </Button>

                {profile && (profile.streak_freezes || 0) >= MAX_STREAK_FREEZES && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                    Você já tem o máximo de {MAX_STREAK_FREEZES} bloqueios
                  </p>
                )}

                {profile && (profile.streak_freezes || 0) < MAX_STREAK_FREEZES && (profile.xp_points || 0) < freezeCost && (
                  <p className="text-xs text-destructive mt-2 text-center">
                    Você precisa de mais {freezeCost - (profile.xp_points || 0)} XP
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Os bloqueios são usados automaticamente quando você não cumpre sua meta diária,
              preservando sua ofensiva. Você ganha 2 XP por minuto de uso da plataforma.
            </p>
          </div>
        </section>
      </div>

      {/* Drawer de detalhes do dia */}
      <DayDetailDrawer
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
        goalMinutes={goalMinutes}
      />

      {/* Dialog de confirmação de compra de bloqueio (apenas primeira compra) */}
      <Dialog
        open={freezePurchaseInfo !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFreezePurchaseInfo(null);
            setHasShownFreezeDialog(true);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-7 h-7 text-cyan-500" />
            </div>
            <DialogTitle>Bloqueio adquirido!</DialogTitle>
            <DialogDescription>
              Sua ofensiva está protegida por mais 1 dia.
            </DialogDescription>
          </DialogHeader>

          {freezePurchaseInfo && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Bloqueios</span>
                <span className="text-sm font-bold text-cyan-500">
                  {freezePurchaseInfo.newTotal}/{MAX_STREAK_FREEZES}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">XP gasto</span>
                <span className="text-sm font-bold text-foreground">-{freezePurchaseInfo.xpSpent} XP</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">XP restante</span>
                <span className="text-sm font-bold text-foreground">{freezePurchaseInfo.xpRemaining} XP</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Quando você não cumprir sua meta diária, o bloqueio será usado automaticamente para proteger sua ofensiva.
              </p>
            </div>
          )}

          <Button
            className="w-full mt-2"
            onClick={() => {
              setFreezePurchaseInfo(null);
              setHasShownFreezeDialog(true);
            }}
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ofensiva;
