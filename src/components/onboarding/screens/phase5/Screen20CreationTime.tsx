import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface Screen20CreationTimeProps {
  value: string;
  onChange: (value: string) => void;
}

export const Screen20CreationTime = ({
  value,
  onChange,
}: Screen20CreationTimeProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">Qual seu melhor horário pra criar?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Escolha o momento do dia em que você tem mais energia criativa.
        </p>
      </div>

      <Card className="p-8 max-w-md mx-auto space-y-6">
        <div className="space-y-4">
          <Label htmlFor="creation-time" className="text-center block text-lg">
            Horário ideal para começar
          </Label>
          <Input
            id="creation-time"
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-lg h-14 text-center"
            autoFocus
          />
          <p className="text-sm text-muted-foreground text-center">
            A Muzze vai te lembrar de criar nesse horário todos os dias.
          </p>
        </div>
      </Card>

      <div className="max-w-2xl mx-auto">
        <Card className="p-6 bg-muted/50">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">💡 Dica:</p>
            <p>
              Escolha um horário em que você geralmente está livre e com energia. 
              Manhã cedo funciona bem para muitos criadores, mas o importante é 
              ser consistente com o horário escolhido.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
