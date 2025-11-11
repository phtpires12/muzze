import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { WORKFLOWS, type WorkflowType } from "@/lib/workflows";
import { Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>("A");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        trackEvent("welcome_screen_viewed");
      }
    };
    checkAuth();
  }, [navigate]);

  const sessionOptions = [15, 25, 30, 45, 60];
  const quickGoals = [30, 45, 60, 90];

  const handleContinue = async () => {
    if (step < 5) {
      setStep(step + 1);
      
      // Track events
      if (step === 0) await trackEvent("onboarding_started");
      if (step === 1) await trackEvent("workflow_selected", { workflow: selectedWorkflow });
      if (step === 2) await trackEvent("time_goals_set", { daily: dailyGoal, weekly: weeklyGoal });
      if (step === 3) await trackEvent("session_pref_set", { minutes: sessionMinutes });
      if (step === 4) await trackEvent("reminder_configured", { time: reminderTime, enabled: notificationsEnabled });
    } else {
      // Final step - save everything and complete onboarding
      try {
        await updateProfile({
          current_workflow: selectedWorkflow,
          daily_goal_minutes: dailyGoal,
          weekly_goal_minutes: weeklyGoal,
          preferred_session_minutes: sessionMinutes,
          reminder_time: reminderTime,
          notifications_enabled: notificationsEnabled,
          first_login: false
        });
        
        await trackEvent("onboarding_complete");
        
        // Wait a bit to ensure profile is updated before navigating
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 300);
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Tela 0 - Boas-vindas */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl mb-4">🎨</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Bem-vindo à Muse
            </h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
              O seu templo de constância criativa.
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Aqui, cada minuto criando vale mais do que qualquer curtida.
            </p>
            <Button size="lg" onClick={handleContinue} className="mt-8">
              Começar
            </Button>
          </div>
        )}

        {/* Tela 1 - Escolha de Workflow */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Como a Muse pode te ajudar?</h2>
              <p className="text-muted-foreground">
                Escolha o caminho que mais se parece com o seu processo criativo atual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(WORKFLOWS).map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    selectedWorkflow === workflow.id
                      ? 'border-2 border-primary bg-primary/5 shadow-xl'
                      : 'border-2 border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="text-5xl w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: workflow.color + '20' }}
                      >
                        {workflow.icon}
                      </div>
                      {selectedWorkflow === workflow.id && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-2">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {workflow.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-destructive">
                          Problema:
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {workflow.problem}
                        </p>
                        
                        <div className="text-xs font-semibold" style={{ color: workflow.color }}>
                          Solução:
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {workflow.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground italic mt-4">
              "Publicar é consequência. Constância é propósito."
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} className="min-w-[200px]">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Tela 2 - Meta de Tempo Criativo */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quanto tempo por dia você quer criar?</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Meta diária</Label>
                  <span className="text-2xl font-bold text-primary">{dailyGoal} min</span>
                </div>
                <Slider
                  value={[dailyGoal]}
                  onValueChange={(value) => {
                    setDailyGoal(value[0]);
                    setWeeklyGoal(value[0] * 7);
                  }}
                  min={15}
                  max={180}
                  step={15}
                  className="w-full"
                />
                <div className="flex gap-2 flex-wrap justify-center">
                  {quickGoals.map((goal) => (
                    <Button
                      key={goal}
                      variant={dailyGoal === goal ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDailyGoal(goal);
                        setWeeklyGoal(goal * 7);
                      }}
                    >
                      {goal} min
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Isso dá <span className="font-bold text-foreground">{(weeklyGoal / 60).toFixed(1)}h</span> por semana
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground italic">
              "Na Muse, você não cria por obrigação. Cria porque o tempo também é uma obra de arte."
            </p>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} className="min-w-[200px]">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Tela 3 - Sessões Criativas */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Qual o tamanho da sua sessão padrão?</h2>
              <p className="text-muted-foreground">
                Você pode mudar isso depois. A constância está no recomeço.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              {sessionOptions.map((minutes) => (
                <Button
                  key={minutes}
                  variant={sessionMinutes === minutes ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSessionMinutes(minutes)}
                  className="min-w-[100px]"
                >
                  {minutes} min
                </Button>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} className="min-w-[200px]">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Tela 4 - Lembretes */}
        {step === 4 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quando quer que a Muse te lembre de criar?</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="reminder-time">Horário do lembrete</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-center text-lg"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Receber lembrete diário</Label>
                  <p className="text-sm text-muted-foreground">
                    E recados do seu progresso
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} className="min-w-[200px]">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Tela 5 - Resumo */}
        {step === 5 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Pronto para começar?</h2>
            </div>

            <div className="grid gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Workflow escolhido</h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{WORKFLOWS[selectedWorkflow].icon}</div>
                  <div>
                    <p className="font-medium">{WORKFLOWS[selectedWorkflow].name}</p>
                    <p className="text-sm text-muted-foreground">{WORKFLOWS[selectedWorkflow].description}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Metas de tempo</h3>
                <p className="text-muted-foreground">
                  {dailyGoal} minutos por dia • {(weeklyGoal / 60).toFixed(1)}h por semana
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Sessão padrão</h3>
                <p className="text-muted-foreground">{sessionMinutes} minutos</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Lembretes</h3>
                <p className="text-muted-foreground">
                  {notificationsEnabled ? `Ativo às ${reminderTime}` : "Desativado"}
                </p>
              </Card>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} className="min-w-[200px]" size="lg">
                Entrar na Muse
              </Button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {step > 0 && step < 6 && (
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full transition-all ${
                  dot === step ? 'bg-primary w-8' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
