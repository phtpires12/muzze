import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, ChevronLeft, ChevronRight, Flame, Check, Snowflake, Gem, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { calculateXPFromMinutes, calculateFreezeCost } from "@/lib/gamification";
import { useProfile } from "@/hooks/useProfile";
import * as htmlToImage from 'html-to-image';
import StreakShareCard from "@/components/StreakShareCard";

const Ofensiva = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysWithProgress, setDaysWithProgress] = useState<Date[]>([]);
  const [freezeDays, setFreezeDays] = useState<Date[]>([]);
  const [freezesUsedThisMonth, setFreezesUsedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
    
    // Criar datas no timezone do usuário
    const now = new Date();
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Ajustar currentMonth para o timezone do usuário
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const minMinutes = profile?.min_streak_minutes || 25; // Default para 25 minutos

    const { data: sessions } = await supabase
      .from('stage_times')
      .select('started_at, duration_seconds')
      .eq('user_id', user.id)
      .gte('started_at', monthStart.toISOString())
      .lte('started_at', monthEnd.toISOString());

    // Group sessions by day in user's timezone
    const dayMap = new Map<string, number>();
    sessions?.forEach(session => {
      if (!session.started_at) return;
      
      // Converter para timezone do usuário
      const sessionDate = new Date(session.started_at);
      const userSessionDate = new Date(sessionDate.toLocaleString('en-US', { timeZone: userTimezone }));
      const day = format(userSessionDate, 'yyyy-MM-dd');
      
      const minutes = (session.duration_seconds || 0) / 60;
      dayMap.set(day, (dayMap.get(day) || 0) + minutes);
    });

    const completedDays: Date[] = [];
    dayMap.forEach((minutes, dayStr) => {
      if (minutes >= minMinutes) {
        // Criar data no timezone local para exibição correta no calendário
        const [year, month, dayNum] = dayStr.split('-').map(Number);
        completedDays.push(new Date(year, month - 1, dayNum));
      }
    });

    setDaysWithProgress(completedDays);
  };

  const fetchFreezesUsedThisMonth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userTimezone = profile?.timezone || 'America/Sao_Paulo';
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const { data: freezeUsage } = await supabase
      .from('streak_freeze_usage')
      .select('used_at')
      .eq('user_id', user.id)
      .gte('used_at', monthStart.toISOString())
      .lte('used_at', monthEnd.toISOString());

    setFreezesUsedThisMonth(freezeUsage?.length || 0);

    // Converter freeze dates para timezone do usuário
    const freezeDates = freezeUsage?.map(f => {
      if (!f.used_at) return new Date();
      const freezeDate = new Date(f.used_at);
      const userFreezeDate = new Date(freezeDate.toLocaleString('en-US', { timeZone: userTimezone }));
      const [year, month, day] = format(userFreezeDate, 'yyyy-MM-dd').split('-').map(Number);
      return new Date(year, month - 1, day);
    }) || [];
    
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

    const freezeCost = calculateFreezeCost(profile.min_streak_minutes || 20);
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
        streak_freezes: (profile.streak_freezes || 0) + 1
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
  const daysCompleted = daysWithProgress.length;
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
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-500/30 to-red-500/20 blur-2xl animate-pulse" />
            
            {/* Chama principal */}
            <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/50">
              <Flame className="w-16 h-16 text-white animate-bounce" />
            </div>
            
            {/* Badge do número */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border-2 border-orange-500 rounded-full px-4 py-1 shadow-lg">
              <span className="text-sm font-bold text-foreground">{streakCount}</span>
            </div>
          </div>

          {/* Texto principal */}
          <div>
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text mb-2">
              {streakCount}
            </h2>
            <p className="text-lg font-semibold text-orange-500">
              {streakCount === 1 ? "dia de ofensiva!" : "dias de ofensiva!"}
            </p>
          </div>
        </div>

        {/* Card de Motivação */}
        <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                {getMotivationalMessage(streakCount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Dedique pelo menos {profile?.min_streak_minutes || 20} minutos criando por dia para manter sua ofensiva.
              </p>
            </div>
          </div>
        </Card>

        {/* Histórico do Mês */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Histórico do mês</h2>
          
          {/* Seletor de Mês */}
          <div className="flex items-center justify-between bg-card/30 p-4 rounded-xl border border-border/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="hover:bg-accent/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              {monthBadge && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                  {monthBadge}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={!canGoNext}
              className="hover:bg-accent/10 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Estatísticas do Mês */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-card/50 border border-border/50 rounded-2xl text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
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
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{milestones.previous}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 mx-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
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
        <Card className="p-6 bg-card/50 border border-border/50 rounded-2xl">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-2">
            {/* Dias vazios antes do primeiro dia do mês */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {/* Dias do mês */}
            {monthDays.map(day => {
              const dayNumber = format(day, 'd');
              const hasProgress = daysWithProgress.some(d => isSameDay(d, day));
              const freezeUsed = freezeDays.some(d => isSameDay(d, day));
              const isDayFuture = isFuture(day) && !isToday(day);
              const isDayToday = isToday(day);

              if (isDayFuture) {
                return (
                  <div
                    key={day.toString()}
                    className="aspect-square flex items-center justify-center text-sm text-muted-foreground/40"
                  >
                    {dayNumber}
                  </div>
                );
              }

              if (freezeUsed && !hasProgress) {
                return (
                  <div key={day.toString()} className="relative aspect-square flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <Snowflake className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 text-xs text-muted-foreground">
                      {dayNumber}
                    </div>
                  </div>
                );
              }

              if (!hasProgress) {
                return (
                  <div
                    key={day.toString()}
                    className="aspect-square flex items-center justify-center text-sm text-muted-foreground/60"
                  >
                    {dayNumber}
                  </div>
                );
              }

              return (
                <div
                  key={day.toString()}
                  className={`aspect-square flex items-center justify-center text-sm font-bold rounded-full ${
                    isDayToday
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md'
                  }`}
                >
                  {dayNumber}
                </div>
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
                <p className="text-lg font-bold text-cyan-500">{profile?.streak_freezes || 0}</p>
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
                  disabled={!profile || (profile.xp_points || 0) < calculateFreezeCost(profile?.min_streak_minutes || 20)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>COMPRAR POR</span>
                    <Gem className="w-4 h-4" />
                    <span>{calculateFreezeCost(profile?.min_streak_minutes || 20)}</span>
                  </div>
                </Button>

                {profile && (profile.xp_points || 0) < calculateFreezeCost(profile.min_streak_minutes || 20) && (
                  <p className="text-xs text-destructive mt-2 text-center">
                    Você precisa de mais {calculateFreezeCost(profile.min_streak_minutes || 20) - (profile.xp_points || 0)} XP
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

      {/* Card oculto para geração de imagem de compartilhamento */}
      <div className="fixed -left-[9999px]" aria-hidden="true">
        <StreakShareCard ref={cardRef} streakCount={streakCount} />
      </div>
    </div>
  );
};

export default Ofensiva;
