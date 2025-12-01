import { Card } from "@/components/ui/card";
import { TrendingDown, Clock, DollarSign, Heart, Briefcase, Target } from "lucide-react";
import { OnboardingData } from "@/types/onboarding";

interface DiagnosisSnapshotProps {
  data: OnboardingData;
  lostPosts: number;
}

export const DiagnosisSnapshot = ({ data, lostPosts }: DiagnosisSnapshotProps) => {
  const avgImpact = data.inconsistency_impact
    ? ((data.inconsistency_impact.financial +
        data.inconsistency_impact.emotional +
        data.inconsistency_impact.professional) /
        3).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Tempo tentando</h3>
          </div>
          <p className="text-3xl font-bold text-accent">
            {data.months_trying} {data.months_trying === 1 ? "mês" : "meses"}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold">Posts perdidos</h3>
          </div>
          <p className="text-3xl font-bold text-destructive">{lostPosts}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Impacto da inconsistência</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-sm">Financeiro</span>
            </div>
            <span className="font-semibold">{data.inconsistency_impact?.financial}/5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm">Emocional</span>
            </div>
            <span className="font-semibold">{data.inconsistency_impact?.emotional}/5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-secondary-foreground" />
              <span className="text-sm">Profissional</span>
            </div>
            <span className="font-semibold">{data.inconsistency_impact?.professional}/5</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Nível geral de impacto</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {avgImpact}/5
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold">Seu compromisso</h3>
            <p className="text-sm text-muted-foreground">
              {data.daily_goal_minutes} minutos diários às {data.creation_time}
            </p>
            <p className="text-sm">
              Nível de compromisso:{" "}
              <strong>
                {data.commitment_level === "high"
                  ? "100% comprometido"
                  : data.commitment_level === "medium"
                  ? "Vou dar meu melhor"
                  : "Quero experimentar"}
              </strong>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
