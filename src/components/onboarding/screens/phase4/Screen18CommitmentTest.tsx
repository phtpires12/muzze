import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Target, TrendingUp } from "lucide-react";

interface Screen18CommitmentTestProps {
  value: string;
  onChange: (value: string) => void;
}

const commitmentOptions = [
  {
    id: "high",
    icon: Flame,
    title: "Estou 100% comprometido",
    description: "Vou criar todos os dias, sem exceção. Estou pronto pra transformar minha consistência.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary",
  },
  {
    id: "medium",
    icon: Target,
    title: "Vou dar meu melhor",
    description: "Sei que vai ter dias difíceis, mas estou disposto a tentar ser consistente.",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent",
  },
  {
    id: "low",
    icon: TrendingUp,
    title: "Quero experimentar",
    description: "Ainda não sei se vou conseguir, mas quero ver se a Muzze me ajuda.",
    color: "text-secondary-foreground",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary",
  },
];

export const Screen18CommitmentTest = ({
  value,
  onChange,
}: Screen18CommitmentTestProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Uma última pergunta importante</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Qual o seu nível de compromisso com criar todos os dias?
        </p>
        <p className="text-sm text-muted-foreground italic">
          (Seja sincero. Não existe resposta errada.)
        </p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {commitmentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <Card
              key={option.id}
              className={`p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                isSelected
                  ? `border-2 ${option.borderColor} ${option.bgColor} shadow-lg`
                  : "border-2 border-transparent hover:border-primary/20"
              }`}
              onClick={() => onChange(option.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${option.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className={`w-6 h-6 ${option.bgColor} rounded-full flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full ${option.color === "text-primary" ? "bg-primary" : option.color === "text-accent" ? "bg-accent" : "bg-secondary-foreground"}`} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 max-w-2xl mx-auto bg-muted/50">
        <p className="text-sm text-center text-muted-foreground">
          Independente da sua resposta, a Muzze vai te ajudar a construir o hábito de criar. 
          O importante é começar.
        </p>
      </Card>
    </div>
  );
};
