import { Card } from "@/components/ui/card";
import { DollarSign, Heart, Briefcase } from "lucide-react";

interface Screen11AccumulatedImpactProps {
  impact: {
    financial: number;
    emotional: number;
    professional: number;
  };
  monthsTrying: number;
}

const impactDescriptions = {
  financial: {
    1: "Impacto financeiro mínimo",
    2: "Perdeu algumas oportunidades de monetização",
    3: "Deixou de ganhar uma renda extra considerável",
    4: "Perdeu oportunidades significativas de crescimento financeiro",
    5: "Essa inconsistência está custando muito dinheiro",
  },
  emotional: {
    1: "Frustração ocasional",
    2: "Frustração frequente com falta de resultados",
    3: "Sentimento constante de estar estagnado",
    4: "Forte sentimento de fracasso e autocrítica",
    5: "Impacto emocional severo na autoestima",
  },
  professional: {
    1: "Impacto profissional mínimo",
    2: "Oportunidades perdidas de networking",
    3: "Crescimento profissional significativamente limitado",
    4: "Carreira estagnada por falta de visibilidade",
    5: "Perda de credibilidade e posicionamento profissional",
  },
};

export const Screen11AccumulatedImpact = ({
  impact,
  monthsTrying,
}: Screen11AccumulatedImpactProps) => {
  const totalImpact = impact.financial + impact.emotional + impact.professional;
  const avgImpact = (totalImpact / 3).toFixed(1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">O custo real da inconsistência</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Durante {monthsTrying} {monthsTrying === 1 ? "mês" : "meses"},
          a falta de constância teve um impacto real na sua vida.
        </p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Impacto Financeiro</span>
                <span className="text-2xl font-bold text-accent">{impact.financial}/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {impactDescriptions.financial[impact.financial as keyof typeof impactDescriptions.financial]}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Impacto Emocional</span>
                <span className="text-2xl font-bold text-primary">{impact.emotional}/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {impactDescriptions.emotional[impact.emotional as keyof typeof impactDescriptions.emotional]}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Impacto Profissional</span>
                <span className="text-2xl font-bold">{impact.professional}/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {impactDescriptions.professional[impact.professional as keyof typeof impactDescriptions.professional]}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Nível geral de impacto</p>
            <div className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {avgImpact}/5
            </div>
            <p className="text-sm font-semibold">
              Esse problema é {parseFloat(avgImpact) >= 4 ? "extremamente sério" : parseFloat(avgImpact) >= 3 ? "muito significativo" : "importante"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
