import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Navigation, Trash2, RotateCcw, Wrench, Timer, Calendar, Search, Copy, RefreshCw, BookOpen, X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from '@/core/hooks';
import { useStreakCelebration } from '@/core/hooks';
import { StreakCelebration } from "@/components/shared";
import { TrophyCelebration } from "@/components/shared";
import { TROPHIES } from '@/core/services';
import { Badge } from "@/components/ui/badge";
import { DraggableSessionTimer } from "@/components/shared";
import { PostConfirmationPopup } from "@/components/calendar";
import { useToast } from '@/core/hooks';
import { AdminPlanSwitcher } from "@/components/content/dev/AdminPlanSwitcher";
import { AdminUserManager } from "@/components/content/dev/AdminUserManager";
import { BuildInfo } from "@/components/shared";
import { useTutorial } from "@/components/content/tutorial/TutorialProvider";
import { supabase } from "@/integrations/supabase/client";
import { useRecaps } from '@/core/hooks';
import { Crown } from "lucide-react";
import { ROUTES } from "@/routes/routes";

const DevTools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDeveloper, isAdmin, isLoading } = useUserRole();
  const { celebrationData, triggerCelebration, triggerTrophyDirectly, dismissStreakCelebration, dismissTrophyCelebration } = useStreakCelebration();
  const { isActive: isTutorialActive, currentContext, restartTutorial, restartAllTutorials, skipTutorial } = useTutorial();

  // Timer simulation state
  const [showTimerSimulation, setShowTimerSimulation] = useState(false);
  const [timerSimulationMode, setTimerSimulationMode] = useState<'normal' | 'streak'>('streak');
  const [simulatedIsPaused, setSimulatedIsPaused] = useState(false);

  // Popup simulation state
  const [showPopupSimulation, setShowPopupSimulation] = useState(false);

  // Recap simulation state
  const [recapPeriodType, setRecapPeriodType] = useState<string>('30d');
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const { refetch: refetchRecaps } = useRecaps();

  // Workspace Debug state
  const [debugData, setDebugData] = useState<any>(null);
  const [debugOverlayEnabled, setDebugOverlayEnabled] = useState(
    typeof window !== 'undefined' && localStorage.getItem('muzze_debug_overlay') === '1'
  );

  const mockScript = {
    id: "mock-script-id",
    title: "Meu Conteúdo de Teste",
    publish_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    publish_status: "planejado" as const,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  };

  // Refresh debug data periodicamente
  useEffect(() => {
    const updateDebugData = () => {
      setDebugData((window as any).__MUZZE_DEBUG__);
    };
    updateDebugData();
    const interval = setInterval(updateDebugData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toggle handler
  const handleToggleOverlay = () => {
    const newValue = !debugOverlayEnabled;
    setDebugOverlayEnabled(newValue);
    if (newValue) {
      localStorage.setItem('muzze_debug_overlay', '1');
    } else {
      localStorage.removeItem('muzze_debug_overlay');
    }
    toast({ title: newValue ? "Debug Overlay ativado" : "Debug Overlay desativado" });
  };

  // Copiar JSON
  const handleCopyDebug = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    toast({ title: "Debug copiado para clipboard!" });
  };

  const handleMockMarkAsPosted = async () => {
    toast({ title: "✅ Simulação", description: "Marcar como postado: " + mockScript.id });
    setShowPopupSimulation(false);
  };

  const handleMockReschedule = async (_: string, newDate: Date) => {
    toast({ title: "📅 Simulação", description: `Remarcar para: ${newDate.toLocaleDateString()}` });
    setShowPopupSimulation(false);
  };

  const handleMockRemindLater = () => {
    toast({ title: "⏰ Simulação", description: "Lembrar mais tarde" });
    setShowPopupSimulation(false);
  };

  const handleMockDelete = async () => {
    toast({ title: "🗑️ Simulação", description: "Excluir conteúdo: " + mockScript.id });
    setShowPopupSimulation(false);
  };

  // Redirect non-developers to home
  useEffect(() => {
    if (!isLoading && !isDeveloper && !isAdmin) {
      navigate(ROUTES.HOME);
    }
  }, [isDeveloper, isAdmin, isLoading, navigate]);

  const handleSimulateStreak = async () => {
    await triggerCelebration(5, 150);
  };

  const handleSimulateTrophy = async () => {
    const exampleTrophy = TROPHIES[0]; // "Primeiro Roteiro" 🎬
    triggerTrophyDirectly(exampleTrophy, 50);
  };

  const handleClearLocalStorage = () => {
    const confirmed = window.confirm("Tem certeza que deseja limpar o localStorage? (session_state e unlocked_trophies)");
    if (confirmed) {
      localStorage.removeItem('muzze_session_state');
      localStorage.removeItem('unlocked_trophies');
      window.location.reload();
    }
  };

  const handleResetOnboarding = () => {
    const confirmed = window.confirm("Tem certeza que deseja resetar os dados do onboarding?");
    if (confirmed) {
      localStorage.removeItem('muzze_onboarding_state');
      alert("Dados do onboarding resetados!");
    }
  };

  const handleGoToOnboarding = () => {
    navigate(ROUTES.ONBOARDING);
  };

  const handleCreateTestRecap = async () => {
    setIsCreatingRecap(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }

      // Calculate period dates based on selected type
      const periodDays = parseInt(recapPeriodType.replace('d', ''));
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() - 1); // Yesterday
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - periodDays + 1);

      // Generate random but realistic stats
      const totalMinutes = Math.floor(Math.random() * 800) + 200; // 200-1000 min
      const daysActive = Math.floor(Math.random() * Math.min(periodDays, 25)) + 5; // 5-30 days
      const sessionsCount = Math.floor(Math.random() * 50) + 10; // 10-60 sessions
      const weeklyGoalHitCount = Math.floor(Math.random() * Math.ceil(periodDays / 7));
      const totalWeeks = Math.ceil(periodDays / 7);

      const stages = ['ideation', 'script', 'recording', 'editing'];
      const favoriteStage = stages[Math.floor(Math.random() * stages.length)];

      // Generate stage breakdown
      const stageBreakdown: Record<string, number> = {};
      let remaining = totalMinutes;
      stages.forEach((stage, i) => {
        if (i === stages.length - 1) {
          stageBreakdown[stage] = remaining;
        } else {
          const portion = Math.floor(Math.random() * (remaining * 0.5));
          stageBreakdown[stage] = portion;
          remaining -= portion;
        }
      });

      // Find best day (random date in period)
      const randomDayOffset = Math.floor(Math.random() * periodDays);
      const bestDayDate = new Date(periodStart);
      bestDayDate.setDate(bestDayDate.getDate() + randomDayOffset);
      const bestDay = bestDayDate.toISOString().split('T')[0];
      const bestDayMinutes = Math.floor(Math.random() * 120) + 60; // 60-180 min

      // Previous period minutes (for comparison)
      const previousPeriodMinutes = Math.random() > 0.3
        ? Math.floor(totalMinutes * (0.5 + Math.random() * 0.8))
        : null;

      const computedStats = {
        stageBreakdown,
        bestDay,
        bestDayMinutes,
        weeklyGoalHitCount,
        totalWeeks,
        previousPeriodMinutes,
        favoriteStage,
      };

      // Delete any existing recap for this period to allow re-testing
      await supabase
        .from('user_recaps')
        .delete()
        .eq('user_id', user.id)
        .eq('period_type', recapPeriodType)
        .eq('period_end', periodEnd.toISOString().split('T')[0]);

      // Insert the test recap
      const { error } = await supabase
        .from('user_recaps')
        .insert({
          user_id: user.id,
          period_type: recapPeriodType,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          total_minutes: totalMinutes,
          days_active: daysActive,
          avg_daily_minutes: Math.round(totalMinutes / daysActive),
          sessions_count: sessionsCount,
          computed_stats: computedStats,
          is_eligible: true,
          viewed_at: null, // Not viewed yet - will show as "new"
        });

      if (error) {
        console.error('Error creating test recap:', error);
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        await refetchRecaps();
        toast({
          title: "✅ Recap criado!",
          description: `Recap de ${recapPeriodType} disponível em /stats`
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ title: "Erro", description: "Falha ao criar recap", variant: "destructive" });
    } finally {
      setIsCreatingRecap(false);
    }
  };

  const handleDeleteAllRecaps = async () => {
    const confirmed = window.confirm("Tem certeza que deseja excluir todos os seus recaps?");
    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_recaps')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        await refetchRecaps();
        toast({ title: "🗑️ Recaps excluídos!" });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao excluir recaps", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-xl text-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isDeveloper && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="max-w-2xl mx-auto px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.PROFILE)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Wrench className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Dev Tools</h1>
            <Badge variant="outline" className="border-primary/50 text-primary">
              {isDeveloper ? "Developer" : "Admin"}
            </Badge>
          </div>
        </div>

        {/* Celebrations Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎉 Celebrações
            </CardTitle>
            <CardDescription>
              Simular animações de streak e troféus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleSimulateStreak}
              className="w-full justify-start"
              variant="outline"
            >
              <Flame className="w-4 h-4 mr-2 text-orange-500" />
              Simular Sessão Completa (5 dias)
            </Button>
            <Button
              onClick={handleSimulateTrophy}
              className="w-full justify-start"
              variant="outline"
            >
              <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
              Simular Troféu Desbloqueado
            </Button>
            <Button
              onClick={() => (window as any).__simulateUpgrade?.('pro')}
              className="w-full justify-start"
              variant="outline"
            >
              <Crown className="w-4 h-4 mr-2 text-primary" />
              Simular Upgrade → Pro
            </Button>
            <Button
              onClick={() => (window as any).__simulateUpgrade?.('studio')}
              className="w-full justify-start"
              variant="outline"
            >
              <Crown className="w-4 h-4 mr-2 text-primary" />
              Simular Upgrade → Studio
            </Button>
          </CardContent>
        </Card>

        {/* Timer Simulation Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Timer Flutuante
            </CardTitle>
            <CardDescription>
              Simular o DraggableTimer em diferentes modos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => {
                setTimerSimulationMode('normal');
                setShowTimerSimulation(true);
                setSimulatedIsPaused(false);
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <Timer className="w-4 h-4 mr-2 text-blue-500" />
              Simular Timer Normal (5 min)
            </Button>
            <Button
              onClick={() => {
                setTimerSimulationMode('streak');
                setShowTimerSimulation(true);
                setSimulatedIsPaused(false);
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <Flame className="w-4 h-4 mr-2 text-orange-500" />
              Simular Timer Ofensiva (30 min)
            </Button>
            {showTimerSimulation && (
              <Button
                onClick={() => setShowTimerSimulation(false)}
                className="w-full justify-start"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Fechar Simulação
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recap Simulation Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Recap
            </CardTitle>
            <CardDescription>
              Criar e testar recaps de progresso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={recapPeriodType} onValueChange={setRecapPeriodType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="60d">60 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="180d">6 meses</SelectItem>
                  <SelectItem value="365d">1 ano</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateTestRecap}
                disabled={isCreatingRecap}
                className="gap-2"
              >
                <Gift className="w-4 h-4" />
                {isCreatingRecap ? "Criando..." : "Criar Recap"}
              </Button>
            </div>
            <Button
              onClick={() => navigate(ROUTES.STATS)}
              className="w-full justify-start"
              variant="outline"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Ver em /stats
            </Button>
            <Button
              onClick={handleDeleteAllRecaps}
              className="w-full justify-start"
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
              Excluir todos os recaps
            </Button>
          </CardContent>
        </Card>

        {/* Popup Simulation Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Popups
            </CardTitle>
            <CardDescription>
              Simular popups e modais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowPopupSimulation(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-2 text-purple-500" />
              Simular Popup de Status de Publicação
            </Button>
          </CardContent>
        </Card>

        {/* Tutorial Desktop Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Tutorial Desktop
            </CardTitle>
            <CardDescription>
              Controlar o tutorial de tooltips para novos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm">Tutorial ativo</span>
              <Badge variant={isTutorialActive ? "default" : "secondary"}>
                {isTutorialActive ? `Sim (${currentContext})` : "Não"}
              </Badge>
            </div>
            <Button
              onClick={() => {
                restartTutorial();
                toast({ title: "Tutorial reiniciado!", description: `Contexto: ${currentContext || 'home'}` });
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2 text-blue-500" />
              Reiniciar Tutorial Atual
            </Button>
            <Button
              onClick={async () => {
                await restartAllTutorials();
                navigate(ROUTES.HOME);
                toast({ title: "Todos os tutoriais reiniciados!", description: "Navegue pelo app para ver os tutoriais." });
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-green-500" />
              Reiniciar TODOS os Tutoriais
            </Button>
            {isTutorialActive && (
              <Button
                onClick={() => {
                  skipTutorial();
                  toast({ title: "Tutorial pulado!" });
                }}
                className="w-full justify-start"
                variant="outline"
              >
                <X className="w-4 h-4 mr-2 text-red-500" />
                Pular Tutorial
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Navigation Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Navegação
            </CardTitle>
            <CardDescription>
              Atalhos para páginas específicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleGoToOnboarding}
              className="w-full justify-start"
              variant="outline"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Ir para Onboarding
            </Button>
          </CardContent>
        </Card>

        {/* User Manager Section */}
        <AdminUserManager />

        {/* Plan Admin Section - Using new AdminPlanSwitcher component */}
        <AdminPlanSwitcher />

        {/* Workspace Debug Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Workspace Debug
            </CardTitle>
            <CardDescription>
              Informações do WorkspaceContext e fallback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Toggle Debug Overlay */}
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm">Debug Overlay no Profile</span>
              <Switch
                checked={debugOverlayEnabled}
                onCheckedChange={handleToggleOverlay}
              />
            </div>

            {/* Debug Data Display */}
            <div className="bg-zinc-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-48">
              <pre>{JSON.stringify(debugData?.workspace || { status: "Navegue para /profile para carregar dados" }, null, 2)}</pre>
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopyDebug}
              variant="outline"
              className="w-full"
              disabled={!debugData}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar JSON
            </Button>
          </CardContent>
        </Card>

        {/* Storage Section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🗑️ Storage & Cache
            </CardTitle>
            <CardDescription>
              Gerenciar dados locais, cache e resetar estados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleClearLocalStorage}
              className="w-full justify-start"
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              Limpar localStorage
            </Button>
            <Button
              onClick={handleResetOnboarding}
              className="w-full justify-start"
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2 text-blue-500" />
              Resetar Onboarding
            </Button>
            <Button
              onClick={async () => {
                try {
                  // Clear all SW caches
                  const cacheNames = await caches.keys();
                  await Promise.all(cacheNames.map(name => caches.delete(name)));

                  // Unregister all service workers
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(registrations.map(reg => reg.unregister()));

                  toast({ title: "✅ Cache PWA limpo!", description: "Recarregando página..." });
                  setTimeout(() => window.location.reload(), 500);
                } catch (err) {
                  toast({ title: "Erro ao limpar cache", variant: "destructive" });
                }
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-green-500" />
              Limpar Cache PWA e Recarregar
            </Button>
          </CardContent>
        </Card>

        {/* Build Info Footer */}
        <div className="text-center py-4">
          <BuildInfo showMode className="justify-center" />
        </div>
      </div>

      {/* Celebration Components */}
      <StreakCelebration
        show={celebrationData.showStreakCelebration}
        streakCount={celebrationData.streakCount}
        weekDays={celebrationData.weekDays}
        onContinue={dismissStreakCelebration}
      />
      <TrophyCelebration
        show={celebrationData.showTrophyCelebration}
        trophy={celebrationData.currentTrophy}
        xpGained={celebrationData.xpGained}
        onContinue={dismissTrophyCelebration}
      />

      {/* Timer Simulation */}
      {showTimerSimulation && (
        <DraggableSessionTimer
          stage={timerSimulationMode === 'streak' ? "🔥 MODO OFENSIVA" : "Ideação"}
          icon={timerSimulationMode === 'streak' ? "Flame" : "Lightbulb"}
          elapsedSeconds={timerSimulationMode === 'streak' ? 1800 : 300}
          targetSeconds={timerSimulationMode === 'streak' ? 1800 : 1500}
          isStreakMode={timerSimulationMode === 'streak'}
          dailyGoalMinutes={30}
          isPaused={simulatedIsPaused}
          onPause={() => setSimulatedIsPaused(true)}
          onResume={() => setSimulatedIsPaused(false)}
          onStop={() => {
            setShowTimerSimulation(false);
            alert("Botão Finalizar clicado! Aqui seria ativada a celebração de ofensiva.");
          }}
          progress={timerSimulationMode === 'streak' ? 100 : 20}
          dailyBaselineSeconds={timerSimulationMode === 'streak' ? 20 * 60 : 0}
        />
      )}

      {/* Popup Simulation */}
      <PostConfirmationPopup
        script={mockScript}
        open={showPopupSimulation}
        onOpenChange={setShowPopupSimulation}
        onMarkAsPosted={handleMockMarkAsPosted}
        onReschedule={handleMockReschedule}
        onRemindLater={handleMockRemindLater}
        onDelete={handleMockDelete}
      />
    </div>
  );
};

export default DevTools;
