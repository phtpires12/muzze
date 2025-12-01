import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";

interface Screen25PaywallProps {
  onContinue: () => void;
}

export const Screen25Paywall = ({ onContinue }: Screen25PaywallProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">Comece seu trial gratuito</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          7 dias grátis para testar todas as funcionalidades da Muzze.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Annual Plan */}
        <Card className="p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            MAIS POPULAR
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">Plano Anual</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold">R$ 24,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                R$ 298,80/ano • 12x sem juros no cartão
              </p>
            </div>
            <ul className="space-y-2">
              {[
                "Acesso completo a todas as funcionalidades",
                "Timer integrado com ofensivas",
                "Workflow guiado (ideação → gravação)",
                "Calendário editorial inteligente",
                "Gamificação com XP e conquistas",
                "Estatísticas detalhadas",
                "Suporte prioritário",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button onClick={onContinue} size="lg" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Começar trial de 7 dias grátis
            </Button>
          </div>
        </Card>

        {/* Monthly Plan */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">Plano Mensal</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold">R$ 35,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                "Todas as funcionalidades do plano anual",
                "Cancele quando quiser",
                "Sem compromisso de longo prazo",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button onClick={onContinue} variant="outline" size="lg" className="w-full">
              Começar com plano mensal
            </Button>
          </div>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-6 bg-muted/50">
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-center">✨ Garantias da Muzze</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• 7 dias grátis para testar tudo</li>
              <li>• Cancele a qualquer momento (sem multa)</li>
              <li>• Suporte via email em até 24h</li>
              <li>• Atualizações constantes e novas funcionalidades</li>
            </ul>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Ao continuar, você inicia um trial gratuito de 7 dias. Após o trial, 
          será cobrado o valor do plano escolhido. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
};
