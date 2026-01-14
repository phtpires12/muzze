import { useState, useEffect, useRef } from "react";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, ChevronLeft, ChevronRight, Snowflake, Gem, Info, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday, getDaysInMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { MAX_STREAK_FREEZES, MAX_STREAK_BONUS_DAYS } from "@/lib/gamification";
import { useProfileWithLevel } from "@/hooks/useProfileWithLevel";
import * as htmlToImage from 'html-to-image';
import StreakShareCard from "@/components/StreakShareCard";
import FireIcon from "@/components/ofensiva/FireIcon";
import DayDetailDrawer, { DayProgress } from "@/components/ofensiva/DayDetailDrawer";
import { getDayKey, getDayBoundsUTC, getMonthStartKey, getMonthEndKey, dayKeyToLocalDate, getDayKeysInRange } from "@/lib/timezone-utils";

const Ofensiva = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, effectiveLevel, goalMinutes, freezeCost } = useProfileWithLevel();
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

    // Usar timezone do usuário para calcular datas corretamente
    const userTimezone = profile?.timezone || 'America/Sao_Paulo';
    
    // Calcular bounds do mês na timezone do usuário usando utilitários centrais
    const monthStartKey = getMonthStartKey(currentMonth, userTimezone);
    const monthEndKey = getMonthEndKey(currentMonth, userTimezone);
    
    // Converter para UTC para queries
    const { startUTC: monthStartUTC } = getDayBoundsUTC(monthStartKey, userTimezone);
    const { endUTC: monthEndUTC } = getDayBoundsUTC(monthEndKey, userTimezone);

    console.log(`[Ofensiva] Buscando sessões do mês:`, {
      userTimezone,
      monthStartKey,
      monthEndKey,
      monthStartUTC: monthStartUTC.toISOString(),
      monthEndUTC: monthEndUTC.toISOString(),
    });

    const { data: sessions } = await supabase
      .from('stage_times')
      .select('created_at, duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', monthStartUTC.toISOString())
      .lte('created_at', monthEndUTC.toISOString());

    // Agrupar sessions por dayKey na timezone do usuário
    const dayMap = new Map<string, number>();
    sessions?.forEach(session => {
      if (!session.created_at) return;
      
      // Usar getDayKey para consistência de timezone
      const sessionDate = new Date(session.created_at);
      const dayKey = getDayKey(sessionDate, userTimezone);
      
      const minutes = (session.duration_seconds || 0) / 60;
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + minutes);
    });

    // Converter dayMap para dayProgressMap
    const progressMap = new Map<string, { minutes: number }>();
    dayMap.forEach((minutes, dayStr) => {
      progressMap.set(dayStr, { minutes });
    });

    console.log(`[Ofensiva] Progresso do mês:`, Object.fromEntries(progressMap));
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

    toast.success("Bloqueio adquirido!", {
      description: "Sua ofensiva está protegida por mais 1 dia."
    });

    // Refresh profile data
    window.location.reload();
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
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header 
        className="sticky z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4"
        style={{ 
          top: 'env(safe-area-inset-top, 0px)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          paddingBottom: '1rem'
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent/10"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-foreground">Ofensiva</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="hover:bg-accent/10"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section - Contador de Streak */}
        <div className="text-center space-y-6">
          {/* Ícone de chama gigante animado */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Halo pulsante */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/30 to-red-500/20 blur-2xl animate-pulse" />
            
            {/* Emoji de fogo principal */}
            <div className="relative z-10 w-full h-full rounded-full bg-zinc-800/90 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <span className="text-7xl animate-pulse drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]">🔥</span>
            </div>
            
            {/* Badge do número */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border-2 border-yellow-500/50 rounded-full px-4 py-1 shadow-lg">
              <span className="text-sm font-bold text-foreground">{streakCount}</span>
            </div>
          </div>

          {/* Texto principal */}
          <div>
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text mb-2">
              {streakCount}
            </h2>
            <p className="text-lg font-semibold text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text">
              {streakCount === 1 ? "dia de ofensiva!" : "dias de ofensiva!"}
            </p>
          </div>
        </div>

        {/* Card de Motivação */}
        <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🔥</span>
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

        {/* Card de Bônus de XP Progressivo */}
        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-foreground">
                  +{streakCount}% de XP
                </p>
                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-500">
                  Bônus Ativo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Cada dia de ofensiva = +1% de bônus em todo XP ganho
              </p>
              {streakCount < MAX_STREAK_BONUS_DAYS && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${(streakCount / MAX_STREAK_BONUS_DAYS) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">
                    {streakCount}/{MAX_STREAK_BONUS_DAYS}
                  </span>
                </div>
              )}
              {streakCount >= MAX_STREAK_BONUS_DAYS && (
                <p className="text-xs font-medium text-orange-500">
                  🎉 Bônus máximo atingido! Você é lendário!
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Estatísticas do Mês */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{daysCompleted}</div>
            <div className="text-xs text-muted-foreground">Dias de prática</div>
          </Card>

          <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-foreground">{freezesUsedThisMonth}</div>
            <div className="text-xs text-muted-foreground">Bloqueios utilizados</div>
          </Card>
        </div>

        {/* Meta de Ofensiva */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Meta de ofensiva</h2>

          <Card className="p-6 bg-card/50 border border-border/50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              {/* Previous milestone */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{milestones.previous}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 mx-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${milestones.progress}%` }}
                  />
                </div>
              </div>

              {/* Next milestone */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg border-2 border-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-bold text-sm">{milestones.next}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Faltam {milestones.next - streakCount} dias para atingir {milestones.next}
            </p>
          </Card>
        </div>

        {/* Calendário Visual */}
        <Card className="p-4 bg-card/30 border border-border/30 rounded-xl">
          {/* Header de navegação do mês */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-sm font-medium text-foreground/80 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={isSameMonth(currentMonth, new Date())}
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground/50">
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
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayNumber = format(day, 'd');
              const progress = dayProgressMap.get(dayKey);
              const minutes = progress?.minutes || 0;
              const freezeUsed = freezeDays.some(d => isSameDay(d, day));
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
                    className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors hover:bg-muted/30 ${
                      isDayToday ? 'ring-1 ring-cyan-500/50' : ''
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
                  className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors hover:bg-muted/30 ${
                    isDayToday ? 'ring-1 ring-orange-500/50' : ''
                  } ${
                    isComplete ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <FireIcon 
                    minutes={minutes} 
                    goalMinutes={goalMinutes} 
                    isToday={isDayToday}
                  />
                  <span className={`text-[10px] ${
                    isComplete 
                      ? 'text-orange-400/80' 
                      : minutes > 0 
                        ? 'text-yellow-500/60' 
                        : 'text-muted-foreground/40'
                  }`}>
                    {dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Proteja a sua Ofensiva (Loja) */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Proteja a sua ofensiva</h2>

          {/* XP Balance */}
          <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seu saldo de XP</p>
                  <p className="text-lg font-bold text-foreground">{profile?.xp_points || 0} XP</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Bloqueios disponíveis</p>
                <p className="text-lg font-bold text-cyan-500">
                  {profile?.streak_freezes || 0}
                  <span className="text-muted-foreground font-normal">/{MAX_STREAK_FREEZES}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Freeze Purchase Card */}
          <Card className="p-6 bg-card/50 border border-border/50 rounded-2xl">
            <div className="flex items-center gap-4">
              {/* Freeze icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <Snowflake className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Info and button */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">Bloqueio de ofensiva</h3>
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
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>COMPRAR POR</span>
                    <Gem className="w-4 h-4" />
                    <span>{freezeCost}</span>
                  </div>
                </Button>

                {profile && (profile.streak_freezes || 0) >= MAX_STREAK_FREEZES && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
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
        </div>
      </div>

      {/* Drawer de detalhes do dia */}
      <DayDetailDrawer 
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
        goalMinutes={goalMinutes}
      />

      {/* Card oculto para geração de imagem de compartilhamento */}
      <div className="fixed -left-[9999px]" aria-hidden="true">
        <StreakShareCard ref={cardRef} streakCount={streakCount} />
      </div>
    </div>
  );
};

export default Ofensiva;
