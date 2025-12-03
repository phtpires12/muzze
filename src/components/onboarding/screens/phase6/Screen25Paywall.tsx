import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Leaf, Unlock, CreditCard, Check } from "lucide-react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Screen25PaywallProps {
  onContinue: () => void;
}

// Logo Component with gradient background (same style as ReminderBell)
const MuzzeLogo = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-24 h-24 mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl animate-pulse" />
      {/* Logo container with gradient */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
        <Leaf className="w-12 h-12 text-white" />
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
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-orange-400/40 rounded-3xl blur-xl animate-pulse" />
      {/* Bell container */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg">
        <Bell className="w-12 h-12 text-white" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground text-center w-[85vw] max-w-sm">
      Te mandaremos um lembrete antes do seu teste gratuito acabar.
    </p>
  </div>
);

export const Screen25Paywall = ({ onContinue }: Screen25PaywallProps) => {
  const [step, setStep] = useState(1);
  const [showLogo, setShowLogo] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  // Calculate trial end date
  const trialEndDate = addDays(new Date(), 7);
  const formattedDate = format(trialEndDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Animation loop for step 1 with longer interval
  useEffect(() => {
    if (step !== 1) return;
    
    const interval = setInterval(() => {
      setShowLogo((prev) => !prev);
    }, 4000); // Increased from 3000 to 4000 for better readability

    return () => clearInterval(interval);
  }, [step]);

  // Step 1: Logo animation with CTA
  if (step === 1) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-between animate-fade-in py-8">
        {/* Animated logo/bell section with crossfade */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative h-[180px] w-full flex items-center justify-center">
            {/* Logo - always rendered, opacity controlled */}
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                showLogo ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <MuzzeLogo />
            </div>
            
            {/* Bell - always rendered, opacity controlled */}
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                showLogo ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <ReminderBell />
            </div>
          </div>
        </div>

        {/* Bottom CTA section */}
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm">Sem cobrança agora</span>
          </div>

          <Button
            onClick={() => setStep(2)}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6"
          >
            Teste por R$0,00
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Depois R$298,80 por ano (R$24,90/mês)
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Timeline and pricing
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Comece o seu teste de 7 dias gratuito para continuar.
        </h2>
      </div>

      {/* Timeline */}
      <div className="space-y-0 py-4">
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
              Você desbloqueia as ferramentas do aplicativo, como o workflow guiado, o timer integrado, a gamificação com XP.
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
              Te enviaremos um lembrete de que seu teste está acabando em breve.
            </p>
          </div>
        </div>

        {/* Step 3: In 7 days - Billing */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold">Em 7 dias - A Cobrança Inicia</p>
            <p className="text-sm text-muted-foreground">
              Você será cobrado no dia {formattedDate}, a não ser que você cancele antes, quando quiser.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing options */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly */}
        <Card
          className={`p-4 cursor-pointer transition-all ${
            selectedPlan === "monthly"
              ? "border-2 border-primary"
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
          className={`p-4 cursor-pointer transition-all relative ${
            selectedPlan === "yearly"
              ? "border-2 border-primary"
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
          onClick={onContinue}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6"
        >
          Começar meu teste gratuito
        </Button>
      </div>
    </div>
  );
};
