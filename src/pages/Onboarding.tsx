import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { WORKFLOWS, type WorkflowType } from "@/lib/workflows";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);
  const [sessionDuration, setSessionDuration] = useState(25);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_login')
        .eq('user_id', user.id)
        .single();

      if (profile && !profile.first_login) {
        navigate("/");
      }
    };
    checkAuth();
    trackEvent('welcome_screen_viewed');
  }, [navigate, trackEvent]);

  const handleContinue = async () => {
    if (step === 6) {
      // Save all data and complete onboarding
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        await supabase
          .from('profiles')
          .update({
            current_workflow: selectedWorkflow,
            daily_goal_minutes: dailyGoal,
            weekly_goal_minutes: weeklyGoal,
            preferred_session_minutes: sessionDuration,
            reminder_time: reminderTime,
            notifications_enabled: notificationsEnabled,
            first_login: false,
          })
          .eq('user_id', user.id);

        await trackEvent('onboarding_complete', {
          workflow: selectedWorkflow,
          daily_goal: dailyGoal,
          session_duration: sessionDuration,
        });

        toast({
          title: "Bem-vindo à Muse!",
          description: "Sua jornada criativa começa agora.",
        });

        navigate("/");
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const canContinue = () => {
    if (step === 2) return selectedWorkflow !== null;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-7xl mb-4">🎨</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Bem-vindo à Muse
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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

        {/* Step 1: Auth is now a separate page */}

        {/* Step 2: Choose Workflow */}
        {step === 2 && (
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
                  onClick={() => {
                    setSelectedWorkflow(workflow.id);
                    trackEvent('workflow_selected', { workflow: workflow.id });
                  }}
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground italic">
              Publicar é consequência. Constância é propósito.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!canContinue()}
                className="min-w-[200px]"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Time Goals */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quanto tempo por dia você quer criar?</h2>
            </div>

            <Card className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-lg">Meta diária: {dailyGoal} minutos</Label>
                <Slider
                  value={[dailyGoal]}
                  onValueChange={([value]) => {
                    setDailyGoal(value);
                    setWeeklyGoal(value * 7);
                  }}
                  min={15}
                  max={180}
                  step={5}
                  className="w-full"
                />
                
                <div className="flex gap-2 flex-wrap">
                  {[30, 45, 60, 90].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={dailyGoal === minutes ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDailyGoal(minutes);
                        setWeeklyGoal(minutes * 7);
                      }}
                    >
                      {minutes}min
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Isso dá {(weeklyGoal / 60).toFixed(1)}h por semana
                </p>
              </div>
            </Card>

            <p className="text-center text-sm text-muted-foreground italic">
              Na Muse, você não cria por obrigação.<br />
              Cria porque o tempo também é uma obra de arte.
            </p>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
              <Button size="lg" onClick={() => {
                trackEvent('time_goals_set', { daily: dailyGoal, weekly: weeklyGoal });
                handleContinue();
              }}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Session Duration */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Qual o tamanho da sua sessão padrão?</h2>
              <p className="text-muted-foreground">
                Você pode mudar isso depois. A constância está no recomeço.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              {[15, 25, 30, 45, 60].map((minutes) => (
                <Button
                  key={minutes}
                  variant={sessionDuration === minutes ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSessionDuration(minutes)}
                  className="min-w-[100px]"
                >
                  {minutes}min
                </Button>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
              <Button size="lg" onClick={() => {
                trackEvent('session_pref_set', { duration: sessionDuration });
                handleContinue();
              }}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Reminders */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quando quer que a Muse te lembre de criar?</h2>
            </div>

            <Card className="p-8 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="reminder-time" className="text-lg">Horário do lembrete</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-base">
                  Receber lembrete diário e recados do seu progresso
                </Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </Card>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
              <Button size="lg" onClick={() => {
                trackEvent('reminder_configured', { time: reminderTime, enabled: notificationsEnabled });
                handleContinue();
              }}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Summary */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Pronto para começar?</h2>
            </div>

            <div className="grid gap-4">
              <Card className="p-6">
                <h3 className="font-bold mb-2">Workflow escolhido</h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{WORKFLOWS[selectedWorkflow!]?.icon}</span>
                  <div>
                    <p className="font-semibold">{WORKFLOWS[selectedWorkflow!]?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {WORKFLOWS[selectedWorkflow!]?.description}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Metas de tempo</h3>
                <p className="text-muted-foreground">
                  {dailyGoal} minutos por dia • {(weeklyGoal / 60).toFixed(1)}h por semana
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Sessão padrão</h3>
                <p className="text-muted-foreground">{sessionDuration} minutos</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Lembretes</h3>
                <p className="text-muted-foreground">
                  {notificationsEnabled ? `Ativo às ${reminderTime}` : "Desativado"}
                </p>
              </Card>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
              <Button size="lg" onClick={handleContinue} disabled={loading} className="min-w-[200px]">
                {loading ? "Salvando..." : "Entrar na Muse"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 1 redirect */}
        {step === 1 && (() => {
          setStep(2);
          return null;
        })()}
      </div>
    </div>
  );
};

export default Onboarding;
