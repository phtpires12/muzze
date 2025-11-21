import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, X, Share2, ChevronLeft, ChevronRight, Shield, Check } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const Ofensiva = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [streakData, setStreakData] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysWithProgress, setDaysWithProgress] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreakData();
    fetchMonthProgress();
  }, [currentMonth]);

  const fetchStreakData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setStreakData(data);
  };

  const fetchMonthProgress = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const { data: sessions } = await supabase
      .from('stage_times')
      .select('started_at, duration_seconds')
      .eq('user_id', user.id)
      .gte('started_at', monthStart.toISOString())
      .lte('started_at', monthEnd.toISOString());

    if (sessions) {
      // Agrupar por dia e filtrar dias que cumpriram a meta
      const minMinutes = profile?.min_streak_minutes || 20;
      const dayMap = new Map<string, number>();

      sessions.forEach(session => {
        const day = format(new Date(session.started_at), 'yyyy-MM-dd');
        const current = dayMap.get(day) || 0;
        dayMap.set(day, current + (session.duration_seconds || 0));
      });

      const days: Date[] = [];
      dayMap.forEach((totalSeconds, dateStr) => {
        const minutes = totalSeconds / 60;
        if (minutes >= minMinutes) {
          days.push(new Date(dateStr));
        }
      });

      setDaysWithProgress(days);
    }
    setLoading(false);
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

  const handleShare = () => {
    toast.success("Em breve!", {
      description: "A funcionalidade de compartilhamento estará disponível em breve.",
    });
  };

  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return "Comece sua jornada criativa hoje!";
    if (streak === 1) return "Ótimo começo! Continue amanhã.";
    if (streak < 7) return "Mantenha a sua ofensiva perfeita: faça uma lição todos os dias!";
    if (streak < 30) return `Incrível! ${streak} dias de criatividade!`;
    if (streak < 100) return `Você é imparável! ${streak} dias seguidos!`;
    return `Lendário! ${streak} dias de ofensiva!`;
  };

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

  const streakCount = streakData?.current_streak ?? 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
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

        {/* Seletor de Mês */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="hover:bg-accent/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground capitalize">
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
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-xs text-muted-foreground">Bloqueios utilizados</div>
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
      </div>
    </div>
  );
};

export default Ofensiva;
