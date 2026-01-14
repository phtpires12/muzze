import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Navigation, Trash2, RotateCcw, Wrench, Timer, Calendar, Search, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useUserRole } from "@/hooks/useUserRole";
import { useStreakCelebration } from "@/hooks/useStreakCelebration";
import { StreakCelebration } from "@/components/StreakCelebration";
import { TrophyCelebration } from "@/components/TrophyCelebration";
import { TROPHIES } from "@/lib/gamification";
import { Badge } from "@/components/ui/badge";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { PostConfirmationPopup } from "@/components/calendar/PostConfirmationPopup";
import { useToast } from "@/hooks/use-toast";
import { AdminPlanSwitcher } from "@/components/dev/AdminPlanSwitcher";

const DevTools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDeveloper, isAdmin, isLoading } = useUserRole();
  const { celebrationData, triggerCelebration, triggerTrophyDirectly, dismissStreakCelebration, dismissTrophyCelebration } = useStreakCelebration();
  
  // Timer simulation state
  const [showTimerSimulation, setShowTimerSimulation] = useState(false);
  const [timerSimulationMode, setTimerSimulationMode] = useState<'normal' | 'streak'>('streak');
  const [simulatedIsPaused, setSimulatedIsPaused] = useState(false);
  
  // Popup simulation state
  const [showPopupSimulation, setShowPopupSimulation] = useState(false);
  
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

  // Admin: Set plan via RPC
  const handleSetPlanType = async (newPlan: 'free' | 'pro' | 'studio') => {
    if (!currentUserId) {
      toast({ title: "Erro", description: "User ID não encontrado", variant: "destructive" });
      return;
    }
    
    setSettingPlan(true);
    try {
      const { error } = await supabase.rpc('admin_set_plan_type', {
        target_user: currentUserId,
        new_plan: newPlan
      });
      
      if (error) throw error;
      
      toast({ title: "✅ Plano atualizado!", description: `Seu plano agora é ${newPlan.toUpperCase()}. Atualizando dados...` });
      
      // Use refetchAll instead of page reload
      await planCapabilities.refetchAll();
      
      toast({ title: "✅ Dados atualizados!", description: `Plano ${newPlan.toUpperCase()} aplicado com sucesso.` });
    } catch (err: any) {
      console.error('[DevTools] Error setting plan:', err);
      toast({ title: "Erro ao definir plano", description: err.message, variant: "destructive" });
    } finally {
      setSettingPlan(false);
    }
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
      navigate("/");
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
    navigate("/onboarding");
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
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
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

        {/* Plan Admin Section */}
        <Card className="mb-4 border-violet-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-500" />
              Gerenciar Plano (DB)
            </CardTitle>
            <CardDescription>
              Alterar o plan_type diretamente no banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan Status */}
            <div className="p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground mb-1">Plano atual (do DB):</p>
              <Badge variant="secondary" className="text-sm">
                {planCapabilities.planType.toUpperCase()}
              </Badge>
              {planCapabilities.isInternalTester && (
                <Badge variant="outline" className="ml-2 text-xs border-amber-500/50 text-amber-600">
                  Internal Tester
                </Badge>
              )}
            </div>
            
            {/* Set Plan Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleSetPlanType('free')}
                disabled={settingPlan || planCapabilities.planType === 'free'}
                variant={planCapabilities.planType === 'free' ? 'default' : 'outline'}
                size="sm"
              >
                {planCapabilities.planType === 'free' && <Check className="w-3 h-3 mr-1" />}
                Free
              </Button>
              <Button
                onClick={() => handleSetPlanType('pro')}
                disabled={settingPlan || planCapabilities.planType === 'pro'}
                variant={planCapabilities.planType === 'pro' ? 'default' : 'outline'}
                size="sm"
                className={planCapabilities.planType === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                {planCapabilities.planType === 'pro' && <Check className="w-3 h-3 mr-1" />}
                Pro
              </Button>
              <Button
                onClick={() => handleSetPlanType('studio')}
                disabled={settingPlan || planCapabilities.planType === 'studio'}
                variant={planCapabilities.planType === 'studio' ? 'default' : 'outline'}
                size="sm"
                className={planCapabilities.planType === 'studio' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                {planCapabilities.planType === 'studio' && <Check className="w-3 h-3 mr-1" />}
                Studio
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Isso altera o plan_type no banco via RPC segura. A página recarrega após a mudança.
            </p>
          </CardContent>
        </Card>

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
              🗑️ Storage
            </CardTitle>
            <CardDescription>
              Gerenciar dados locais e resetar estados
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
          </CardContent>
        </Card>
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
