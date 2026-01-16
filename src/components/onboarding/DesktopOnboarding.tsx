import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import muzzeLogoRounded from "@/assets/muzze-logo-rounded.png";

// Platform icons
import instagramLogo from "@/assets/instagram-logo.png";
import youtubeLogo from "@/assets/youtube-logo.png";
import tiktokLogo from "@/assets/tiktok-logo.png";

type Step = 'welcome' | 'username' | 'platform' | 'signup';

interface DesktopOnboardingProps {
  onComplete?: () => void;
}

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: youtubeLogo },
  { id: 'instagram', name: 'Instagram', icon: instagramLogo },
  { id: 'tiktok', name: 'TikTok', icon: tiktokLogo },
];

export function DesktopOnboarding({ onComplete }: DesktopOnboardingProps) {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  
  const [step, setStep] = useState<Step>('welcome');
  const [username, setUsername] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    trackEvent('desktop_onboarding_started');
  }, [trackEvent]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username,
            preferred_platform: selectedPlatforms.join(','),
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with onboarding data
        await supabase
          .from('profiles')
          .update({
            username,
            preferred_platform: selectedPlatforms.join(','),
            first_login: false,
            desktop_tutorial_completed: false, // Will show tutorial
            onboarding_data: {
              username,
              preferred_platform: selectedPlatforms.join(','),
              completed_at: new Date().toISOString(),
              version: 'desktop-minimal-1.0',
            }
          })
          .eq('user_id', data.user.id);

        trackEvent('desktop_onboarding_completed');
        
        toast.success("Conta criada com sucesso! 🎉");
        
        // Check for pending invite
        const pendingInviteId = localStorage.getItem("pendingInviteId");
        if (pendingInviteId) {
          localStorage.removeItem("pendingInviteId");
          navigate(`/invite?id=${pendingInviteId}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error("Este email já está registrado. Tente fazer login.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const canContinue = () => {
    switch (step) {
      case 'welcome': return true;
      case 'username': return username.trim().length > 0;
      case 'platform': return selectedPlatforms.length > 0;
      case 'signup': return email.trim().length > 0 && password.length >= 6;
      default: return false;
    }
  };

  const nextStep = () => {
    switch (step) {
      case 'welcome': setStep('username'); break;
      case 'username': setStep('platform'); break;
      case 'platform': setStep('signup'); break;
      case 'signup': handleSignup(); break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'username': setStep('welcome'); break;
      case 'platform': setStep('username'); break;
      case 'signup': setStep('platform'); break;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <img 
              src={muzzeLogoRounded} 
              alt="Muzze" 
              className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Bem-vindo ao Muzze
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Seu co-piloto de criação de conteúdo. 
                Vamos configurar sua conta em menos de 1 minuto.
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleLogin}>
                Já tenho conta
              </Button>
              <Button onClick={nextStep} size="lg">
                Começar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'username':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Como você quer ser chamado?
              </h2>
              <p className="text-muted-foreground">
                Esse nome aparecerá no seu perfil
              </p>
            </div>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome ou apelido"
              className="text-center text-lg h-14"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canContinue() && nextStep()}
            />
          </div>
        );

      case 'platform':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Onde você publica seu conteúdo?
              </h2>
              <p className="text-muted-foreground">
                Selecione uma ou mais plataformas
              </p>
            </div>
            <div className="flex justify-center gap-4">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200",
                      "hover:scale-105 hover:shadow-md",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2">
                        <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                      </div>
                    )}
                    <img 
                      src={platform.icon} 
                      alt={platform.name} 
                      className="w-12 h-12 object-contain"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'signup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Crie sua conta
              </h2>
              <p className="text-muted-foreground">
                Quase lá! Só precisamos do seu email e uma senha.
              </p>
            </div>
            <div className="space-y-4 max-w-sm mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12"
                autoFocus
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mínimo 6 caracteres)"
                className="h-12"
                onKeyDown={(e) => e.key === 'Enter' && canContinue() && handleSignup()}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <a href="/terms" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>
            </p>
          </div>
        );
    }
  };

  const stepNumber = ['welcome', 'username', 'platform', 'signup'].indexOf(step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-xl p-8 space-y-8">
        {/* Progress indicators */}
        {step !== 'welcome' && (
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-1.5 rounded-full transition-colors",
                  i <= stepNumber ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {renderStep()}

        {/* Navigation buttons */}
        {step !== 'welcome' && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canContinue() || isLoading}
              className="gap-2 min-w-[140px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {step === 'signup' ? 'Criar conta' : 'Continuar'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
