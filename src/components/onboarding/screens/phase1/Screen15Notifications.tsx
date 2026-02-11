import { useState } from "react";
import { ChevronLeft, Bell, Clock, Flame, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";

interface Screen15NotificationsProps {
  onContinue: () => void;
  onBack: () => void;
}

export const Screen15Notifications = ({
  onContinue,
  onBack,
}: Screen15NotificationsProps) => {
  const { requestPermission, isLoading } = useNotifications();
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    await requestPermission();
    setActivating(false);
    onContinue();
  };

  const bullets = [
    { icon: Clock, text: "Lembrete no horário que você escolheu" },
    { icon: Flame, text: "Avisos de ofensivas em risco" },
    { icon: Trophy, text: "Celebração de conquistas e marcos" },
    { icon: X, text: "Você pode desativar a qualquer momento" },
  ];

  return (
    <div className="min-h-[100dvh] bg-secondary/30 flex flex-col">
      {/* Header with back button */}
      <div className="px-4 pt-4 sm:pt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-8 leading-tight">
          Podemos te mandar notificações nesse horário e/ou em outros?
        </h1>

        {/* Action buttons */}
        <div className="space-y-3 mb-8">
          <Button
            variant="gradient-pill"
            size="xl"
            className="w-full"
            onClick={handleActivate}
            disabled={activating || isLoading}
          >
            {activating ? "Ativando..." : "Ativar notificações"}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground"
            onClick={onContinue}
            disabled={activating}
          >
            Pular por enquanto
          </Button>
        </div>

        {/* Info card */}
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground mb-4">
              Por que ativar notificações?
            </p>
            <div className="space-y-3">
              {bullets.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
