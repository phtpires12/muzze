import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Sparkles, Calendar, Users, Zap } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Confetti } from "@/components/Confetti";

const PRO_FEATURES = [
  { icon: Sparkles, label: "Conteúdos ilimitados", description: "Crie quantos conteúdos quiser por semana" },
  { icon: Calendar, label: "Planejamento futuro", description: "Agende para qualquer data" },
  { icon: Users, label: "Colaboradores", description: "Convide sua equipe para trabalhar junto" },
  { icon: Zap, label: "Recursos premium", description: "Acesso a todas as funcionalidades" },
];

const PaywallSuccess = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('upgrade_success_viewed', {});
  }, []);

  const handleContinue = () => {
    trackEvent('upgrade_success_continue_clicked', {});
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Confetti />
      
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success header */}
        <div className="text-center mb-8 pt-8">
          {/* Animated logo */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
              <img src={muzzeLeafWhite} alt="Muzze Logo" className="w-12 h-12 object-contain" />
            </div>
            {/* Success badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Bem-vindo ao Pro! 🎉
          </h1>
          <p className="text-muted-foreground">
            Seu upgrade foi concluído com sucesso
          </p>
        </div>

        {/* Plan badge */}
        <Card className="border border-primary/20 bg-primary/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Plano Pro Ativo</p>
              <p className="text-sm text-muted-foreground">Todos os recursos desbloqueados</p>
            </div>
          </div>
        </Card>

        {/* Features unlocked */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">O que você desbloqueou:</h2>
          
          <div className="space-y-3">
            {PRO_FEATURES.map((feature, i) => (
              <Card key={i} className="border border-border rounded-xl bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.label}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <Card className="border border-border rounded-xl bg-muted/30 p-4 mb-8">
          <h3 className="font-semibold mb-3">Próximos passos</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              Crie seu primeiro conteúdo da semana
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              Explore o calendário editorial
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              Convide sua equipe para colaborar
            </li>
          </ul>
        </Card>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-lg"
        >
          Começar a criar
        </Button>
      </div>
    </div>
  );
};

export default PaywallSuccess;
