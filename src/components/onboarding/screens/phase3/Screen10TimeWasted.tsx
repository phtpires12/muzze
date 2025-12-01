import { Card } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";

interface Screen10TimeWastedProps {
  monthsTrying: number;
}

export const Screen10TimeWasted = ({ monthsTrying }: Screen10TimeWastedProps) => {
  const weeksWasted = Math.floor((monthsTrying * 30) / 7);
  const daysWasted = monthsTrying * 30;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">
          {monthsTrying} {monthsTrying === 1 ? "mês" : "meses"} tentando sozinho
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Isso é tempo demais lutando contra a inconsistência sem as ferramentas certas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <Card className="p-6 text-center space-y-3">
          <div className="text-4xl font-bold text-accent">{monthsTrying}</div>
          <p className="text-sm text-muted-foreground">
            {monthsTrying === 1 ? "Mês" : "Meses"} de frustração
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="text-4xl font-bold text-accent">{weeksWasted}</div>
          <p className="text-sm text-muted-foreground">
            {weeksWasted === 1 ? "Semana" : "Semanas"} sem progresso real
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3 md:col-span-2">
          <div className="text-5xl font-bold text-accent">{daysWasted}</div>
          <p className="text-sm text-muted-foreground">
            {daysWasted === 1 ? "Dia" : "Dias"} que poderiam ter sido produtivos
          </p>
        </Card>
      </div>

      <Card className="p-6 max-w-2xl mx-auto bg-accent/5 border-accent/20">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="font-semibold">O problema não é você</p>
            <p className="text-sm text-muted-foreground">
              Você só estava usando as ferramentas erradas. Apps generalistas como Notion
              não foram feitos para criadores de conteúdo solo que lutam com constância.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
