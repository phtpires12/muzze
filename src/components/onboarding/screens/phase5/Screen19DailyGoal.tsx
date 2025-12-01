import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Check } from "lucide-react";

interface Screen19DailyGoalProps {
  value: number;
  onChange: (value: number) => void;
  onAcceptDefault: () => void;
}

export const Screen19DailyGoal = ({
  value,
  onChange,
  onAcceptDefault,
}: Screen19DailyGoalProps) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Timer className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Vamos confirmar seu compromisso?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A recomendação da Muzze é começar com 25 minutos diários.
        </p>
      </div>

      <Card className="p-8 max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              25 minutos
            </div>
            <p className="text-lg">por dia</p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 justify-center">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm">Baseado em ciência</p>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm">Sustentável a longo prazo</p>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm">Menos de 2% do seu dia</p>
            </div>
          </div>
        </div>
      </Card>

      {!showCustom ? (
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <Button
            onClick={onAcceptDefault}
            size="lg"
            className="w-full max-w-sm"
          >
            Topar esse compromisso
          </Button>
          <Button
            variant="link"
            onClick={() => setShowCustom(true)}
            className="text-muted-foreground"
          >
            Quero ajustar esse tempo
          </Button>
        </div>
      ) : (
        <div className="space-y-6 max-w-md mx-auto">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Escolha sua meta diária (em minutos):
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {[15, 20, 25, 30, 45, 60].map((minutes) => (
                <Button
                  key={minutes}
                  variant={value === minutes ? "default" : "outline"}
                  size="lg"
                  onClick={() => onChange(minutes)}
                  className="min-w-[90px]"
                >
                  {minutes} min
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
