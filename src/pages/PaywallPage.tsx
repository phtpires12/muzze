import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Unlock, RefreshCw, Check, ArrowLeft, Crown } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";

const ZOUTI_CHECKOUT_URL = "https://pay.zouti.com.br/checkout?poi=prod_offer_6f2pv1lxpkwlwv72vv3xgs";

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

// Shield component for guarantee
const GuaranteeShield = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-3xl blur-xl animate-pulse" />
      <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg">
        <Shield className="w-12 h-12 text-white" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground text-center w-[85vw] max-w-sm">
      Garantia incondicional de 7 dias. Cancele e receba reembolso integral.
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

  const handleSubscribe = () => {
    trackEvent('paywall_subscribe_clicked', {
      selectedPlan,
      currentPlan: planCapabilities?.planType || 'unknown',
    });
    
    trackEvent('zouti_checkout_opened', {
      selectedPlan,
    });
    
    // Open Zouti checkout in new tab
    window.open(ZOUTI_CHECKOUT_URL, '_blank');
  };

  const handleContinueFree = () => {
    trackEvent('paywall_continue_free_clicked', {
      currentPlan: planCapabilities?.planType || 'unknown',
    });
    navigate(-1);
  };

  // Calculate guarantee end date
  const guaranteeEndDate = addDays(new Date(), 7);
  const formattedGuaranteeDate = format(guaranteeEndDate, "d 'de' MMMM", { locale: ptBR });

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
            {/* Animated logo/shield section */}
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
                  <GuaranteeShield />
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
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Garantia de 7 dias</span>
              </div>

              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-lg"
              >
                Ver planos Pro
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Cancele em até 7 dias e receba reembolso integral
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
            <p className="text-sm text-muted-foreground">Garantia de 7 dias</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Assine o Muzze Pro
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesso imediato a todos os recursos premium
            </p>
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
                    Acesso liberado a todas as ferramentas do aplicativo.
                  </p>
                </div>
              </div>

              {/* Step 2: 7 days - Guarantee */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold">Até {formattedGuaranteeDate}</p>
                  <p className="text-sm text-muted-foreground">
                    Garantia incondicional. Cancele e receba reembolso integral.
                  </p>
                </div>
              </div>

              {/* Step 3: Renewal */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Renovação automática</p>
                  <p className="text-sm text-muted-foreground">
                    Após o período de garantia, sua assinatura renova automaticamente.
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
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm">Garantia de reembolso em 7 dias</span>
            </div>

            <Button
              onClick={handleSubscribe}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-lg"
            >
              Assinar agora
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Protegido pelo Código de Defesa do Consumidor
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
};

export default PaywallPage;
