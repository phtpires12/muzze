import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Navigation, Trash2, RotateCcw, Wrench, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { useStreakCelebration } from "@/hooks/useStreakCelebration";
import { StreakCelebration } from "@/components/StreakCelebration";
import { TrophyCelebration } from "@/components/TrophyCelebration";
import { TROPHIES } from "@/lib/gamification";
import { Badge } from "@/components/ui/badge";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";

const DevTools = () => {
  const navigate = useNavigate();
  const { isDeveloper, isAdmin, isLoading } = useUserRole();
  const { celebrationData, triggerCelebration, triggerTrophyDirectly, dismissStreakCelebration, dismissTrophyCelebration } = useStreakCelebration();
  
  // Timer simulation state
  const [showTimerSimulation, setShowTimerSimulation] = useState(false);
  const [timerSimulationMode, setTimerSimulationMode] = useState<'normal' | 'streak'>('streak');
  const [simulatedIsPaused, setSimulatedIsPaused] = useState(false);
  
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
        />
      )}
    </div>
  );
};

export default DevTools;
