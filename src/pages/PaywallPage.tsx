import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Unlock, CreditCard, Check, ArrowLeft, Crown } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";

// Logo Component with gradient background
const MuzzeLogo = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl animate-pulse" />
      <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
        <img src={muzzeLeafWhite} alt="Muzze Logo" className="w-12 h-12 object-contain" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground text-center w-[85vw] max-w-sm">
      Sua jornada de consistência criativa começa aqui.
    </p>
  </div>
);

// Bell notification component with glow effect
const ReminderBell = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-orange-400/40 rounded-3xl blur-xl animate-pulse" />
      <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg">
        <Bell className="w-12 h-12 text-white" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground text-center w-[85vw] max-w-sm">
      Te mandaremos um lembrete antes do seu teste gratuito acabar.
    </p>
  </div>
);

const PRO_BENEFITS = [
  "Conteúdos ilimitados por semana",
  "Planeje qualquer data futura",
  "Convide colaboradores",
  "Todos os recursos premium",
];

const PaywallPage = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const planCapabilities = usePlanCapabilitiesOptional();
  
  const [step, setStep] = useState(1);
  const [showLogo, setShowLogo] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  // Track page view
  useEffect(() => {
    trackEvent('paywall_page_viewed', {
      currentPlan: planCapabilities?.planType || 'unknown',
    });
  }, []);

  const handleBackClick = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  const handleStartTrial = () => {
    trackEvent('paywall_start_trial_clicked', {
      selectedPlan,
      currentPlan: planCapabilities?.planType || 'unknown',
    });
    
    // TODO: Implementar integração com Stripe
    console.log('[PaywallPage] Start trial clicked - implement Stripe integration', { selectedPlan });
  };

  const handleContinueFree = () => {
    trackEvent('paywall_continue_free_clicked', {
      currentPlan: planCapabilities?.planType || 'unknown',
    });
    navigate(-1);
  };

  // Calculate trial end date
  const trialEndDate = addDays(new Date(), 7);
  const formattedDate = format(trialEndDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Animation loop for step 1
  useEffect(() => {
    if (step !== 1) return;
    
    const interval = setInterval(() => {
      setShowLogo((prev) => !prev);
    }, 4000);

    return () => clearInterval(interval);
  }, [step]);

  // Step 1: Logo animation with CTA
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Upgrade para Pro</h1>
              <p className="text-sm text-muted-foreground">Desbloqueie todo o potencial</p>
            </div>
          </div>

          {/* Main content */}
          <div className="min-h-[60vh] flex flex-col items-center justify-between py-8">
            {/* Animated logo/bell section */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative h-[180px] w-full flex items-center justify-center">
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                    showLogo ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <MuzzeLogo />
                </div>
                
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                    showLogo ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <ReminderBell />
                </div>
              </div>
            </div>

            {/* Benefits preview */}
            <div className="w-full space-y-4 mb-8">
              <Card className="border border-border rounded-xl bg-background p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold">Com o Pro você ganha:</p>
                </div>
                <ul className="space-y-2">
                  {PRO_BENEFITS.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" strokeWidth={2} />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Bottom CTA section */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Sem cobrança agora</span>
              </div>

              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-lg"
              >
                Teste por R$0,00
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Depois R$298,80 por ano (R$24,90/mês)
              </p>

              <Button 
                variant="ghost" 
                onClick={handleContinueFree} 
                className="w-full"
              >
                Continuar no Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Timeline and pricing
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Escolha seu plano</h1>
            <p className="text-sm text-muted-foreground">7 dias grátis para testar</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Comece o seu teste de 7 dias gratuito
            </h2>
          </div>

          {/* Timeline */}
          <Card className="border border-border rounded-xl bg-background p-4">
            <div className="space-y-0">
              {/* Step 1: Today */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Unlock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold">Hoje</p>
                  <p className="text-sm text-muted-foreground">
                    Você desbloqueia todas as ferramentas do aplicativo.
                  </p>
                </div>
              </div>

              {/* Step 2: In 7 days - Reminder */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold">Em 7 dias</p>
                  <p className="text-sm text-muted-foreground">
                    Te enviaremos um lembrete de que seu teste está acabando.
                  </p>
                </div>
              </div>

              {/* Step 3: Billing */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Cobrança inicia</p>
                  <p className="text-sm text-muted-foreground">
                    Você será cobrado no dia {formattedDate}, a não ser que cancele antes.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <Card
              className={`p-4 cursor-pointer transition-all rounded-xl ${
                selectedPlan === "monthly"
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border hover:border-muted-foreground"
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <p className="text-sm text-muted-foreground">Mensal</p>
              <p className="text-xl font-bold">R$35,90</p>
              <p className="text-xs text-muted-foreground">/ mês</p>
            </Card>

            {/* Yearly (Recommended) */}
            <Card
              className={`p-4 cursor-pointer transition-all relative rounded-xl ${
                selectedPlan === "yearly"
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border hover:border-muted-foreground"
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                Recomendado
              </div>
              <p className="text-sm text-muted-foreground">Anual</p>
              <p className="text-xl font-bold">R$298,80</p>
              <p className="text-xs text-muted-foreground">/ ano</p>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm">Sem cobrança agora</span>
            </div>

            <Button
              onClick={handleStartTrial}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-lg"
            >
              Começar meu teste gratuito
            </Button>

            <Button 
              variant="ghost" 
              onClick={handleContinueFree} 
              className="w-full"
            >
              Continuar no Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallPage;
