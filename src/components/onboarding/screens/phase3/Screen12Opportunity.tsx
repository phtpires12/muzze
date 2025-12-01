import { Card } from "@/components/ui/card";
import { TrendingUp, CheckCircle2 } from "lucide-react";

interface Screen12OpportunityProps {}

export const Screen12Opportunity = ({}: Screen12OpportunityProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Mas e se você conseguisse?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Imagine como sua vida mudaria com constância real.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="p-8 space-y-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              30 posts
            </div>
            <p className="text-xl font-semibold">em 30 dias</p>
            <p className="text-muted-foreground">
              Com a Muzze, você pode transformar sua criação em um hábito diário sustentável.
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <strong>Clareza total:</strong> sempre saber exatamente o que criar hoje
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <strong>Identidade sólida:</strong> se tornar "aquele criador que sempre posta"
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <strong>Crescimento consistente:</strong> mais visibilidade, engajamento e oportunidades
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <strong>Fim da procrastinação:</strong> criar deixa de ser uma luta e vira rotina
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
