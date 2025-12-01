import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

interface Screen23NotificationsProps {
  onAccept: () => void;
  onSkip: () => void;
}

export const Screen23Notifications = ({
  onAccept,
  onSkip,
}: Screen23NotificationsProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Vamos te lembrar de criar?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ative notificações para não esquecer seu compromisso diário.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Por que ativar notificações?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Lembrete no horário que você escolheu</li>
                  <li>• Avisos de ofensivas em risco</li>
                  <li>• Celebração de conquistas e marcos</li>
                  <li>• Você pode desativar a qualquer momento</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button onClick={onAccept} size="lg" className="w-full">
            Ativar notificações
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Pular por enquanto
          </Button>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground max-w-md mx-auto">
        Notificações ajudam você a manter a constância. Mas se preferir, 
        você pode ativá-las depois nas configurações.
      </p>
    </div>
  );
};
