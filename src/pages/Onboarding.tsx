import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import instagramLogo from "@/assets/instagram-logo.png";
import youtubeLogo from "@/assets/youtube-logo.png";
import tiktokLogo from "@/assets/tiktok-logo.png";
import greekStatue from "@/assets/greek-statue.png";

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<string>("");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(25);
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [visibleCards, setVisibleCards] = useState(1);
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

  useEffect(() => {
    if (step === 1) {
      setVisibleCards(1);
    }
  }, [step]);

  const handleContinue = async () => {
    if (step < 5) {
      setStep(step + 1);
      
      // Track events
      if (step === 0) await trackEvent("onboarding_started");
      if (step === 1) await trackEvent("methodology_viewed");
      if (step === 2) await trackEvent("platform_selected", { platform });
      if (step === 3) await trackEvent("daily_goal_set", { minutes: dailyGoalMinutes });
      if (step === 4) await trackEvent("reminder_configured", { time: reminderTime, enabled: notificationsEnabled });
    } else {
      // Final step - save everything and complete onboarding
      try {
        await updateProfile({
          preferred_platform: platform,
          daily_goal_minutes: dailyGoalMinutes,
          reminder_time: reminderTime,
          notifications_enabled: notificationsEnabled,
          first_login: false
        });
        
        await trackEvent("onboarding_complete");
        
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
        {/* Step 0 - Boas-vindas */}
        {step === 0 && (
          <div className="text-center space-y-4 animate-fade-in">
            <img 
              src={greekStatue} 
              alt="Estátua grega" 
              className="w-40 h-40 mx-auto object-contain mb-4"
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Bem-vindo à Muzze.
            </h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto">
              O app que organiza sua criatividade.
            </p>
            <Button size="lg" onClick={handleContinue} className="mt-6 h-14 px-12 text-lg">
              Começar
            </Button>
          </div>
        )}

        {/* Step 1 - Como a Muzze vai te ajudar */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Como a Muzze vai te ajudar</h2>
            </div>

            <div className="space-y-6">
              {/* Card 1 - Constância diária */}
              {visibleCards >= 1 && (
                <Card className="p-6 animate-fade-in">
                  <div className="flex gap-4">
                    <div className="text-3xl">🌱</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Constância diária</h3>
                      <p className="text-muted-foreground">
                        A Muzze foi criada para te ajudar a <strong>criar um pouco todos os dias</strong>, 
                        sem pressão e sem perfeccionismo.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Card 2 - Minutos, não posts */}
              {visibleCards >= 2 && (
                <Card className="p-6 animate-fade-in">
                  <div className="flex gap-4">
                    <div className="text-3xl">⏰</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Minutos, não posts</h3>
                      <p className="text-muted-foreground">
                        Nós medimos seu progresso pelo <strong>tempo criando</strong>, 
                        não pela quantidade de publicações.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Card 3 - Sessões criativas */}
              {visibleCards >= 3 && (
                <Card className="p-6 animate-fade-in">
                  <div className="flex gap-4">
                    <div className="text-3xl">⏱️</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Sessões criativas</h3>
                      <p className="text-muted-foreground">
                        Você escolhe a etapa do seu processo (ideias, roteiro, revisão, gravação ou edição), 
                        inicia uma sessão e cria com foco total.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="flex justify-center pt-4">
              {visibleCards < 3 ? (
                <Button onClick={() => setVisibleCards(v => v + 1)} size="lg" className="min-w-[300px]">
                  Continuar
                </Button>
              ) : (
                <Button onClick={handleContinue} size="lg" className="min-w-[300px]">
                  Entendi, quero criar todos os dias
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 2 - Onde você publica mais? */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Onde você publica mais?</h2>
              <p className="text-muted-foreground">
                Isso nos ajuda a ajustar a experiência pra você.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'instagram', name: 'Instagram', logo: instagramLogo },
                { id: 'tiktok', name: 'TikTok', logo: tiktokLogo },
                { id: 'youtube', name: 'YouTube', logo: youtubeLogo },
                { id: 'outros', name: 'Outros', icon: '🌐' }
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                    platform === option.id
                      ? 'border-2 border-primary bg-primary/5 shadow-lg'
                      : 'border-2 border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => setPlatform(option.id)}
                >
                  <div className="text-center space-y-2">
                    {'logo' in option ? (
                      <img 
                        src={option.logo} 
                        alt={option.name} 
                        className="w-20 h-20 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-4xl">{option.icon}</div>
                    )}
                    <p className="font-medium">{option.name}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button 
                onClick={handleContinue} 
                disabled={!platform}
                className="min-w-[200px]"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Meta diária mínima */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">Vamos combinar um mínimo diário?</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Para construir constância, a Muzze recomenda começar com{' '}
                <strong className="text-foreground">25 minutos por dia de sessão criativa.</strong>
                <br />
                É pouco o suficiente pra caber na rotina, mas poderoso o bastante pra mover sua criatividade.
              </p>
            </div>

            {!showCustomGoal ? (
              <div className="flex flex-col items-center gap-4">
                <Button onClick={handleContinue} size="lg" className="min-w-[300px]">
                  Topar esse compromisso
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => setShowCustomGoal(true)}
                  className="text-muted-foreground"
                >
                  Quero ajustar esse tempo
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Escolha sua meta diária:
                  </p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {[15, 25, 30, 45, 60].map((minutes) => (
                      <Button
                        key={minutes}
                        variant={dailyGoalMinutes === minutes ? "default" : "outline"}
                        size="lg"
                        onClick={() => setDailyGoalMinutes(minutes)}
                        className="min-w-[90px]"
                      >
                        {minutes} min
                      </Button>
                    ))}
                  </div>
                </div>

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
          </div>
        )}

        {/* Step 4 - Lembrete diário */}
        {step === 4 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quando você quer que a Muzze te lembre de criar?</h2>
              <p className="text-muted-foreground">
                Um lembrete por dia, no horário que fizer mais sentido pra você.
              </p>
            </div>

            <Card className="p-8 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="reminder-time">Horário do lembrete</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-lg h-12"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Receber lembrete diário</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative para receber notificações
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </Card>

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

        {/* Step 5 - Resumo */}
        {step === 5 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Pronto para começar?</h2>
            </div>

            <div className="grid gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Meta diária</h3>
                <p className="text-muted-foreground">{dailyGoalMinutes} minutos por dia</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Plataforma principal</h3>
                <p className="text-muted-foreground capitalize">{platform}</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Lembretes</h3>
                <p className="text-muted-foreground">
                  {notificationsEnabled ? `Ativo às ${reminderTime}` : "Desativado"}
                </p>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Você pode mudar tudo isso depois em Ajustes.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
                Entrar na Muzze
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
