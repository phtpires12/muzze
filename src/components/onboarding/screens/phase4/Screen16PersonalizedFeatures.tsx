import { Card } from "@/components/ui/card";
import { CheckCircle2, Lightbulb, FileText, ListChecks, Video, Scissors } from "lucide-react";

interface Screen16PersonalizedFeaturesProps {
  stickingPoints: string[];
}

const featureMap: Record<string, { icon: any; title: string; description: string }> = {
  "Não sei o que postar": {
    icon: Lightbulb,
    title: "Brainstorm guiado de ideias",
    description: "Nunca mais fique sem saber o que criar. O brainstorm da Muzze te ajuda a organizar e desenvolver ideias rapidamente.",
  },
  "Não consigo terminar o que começo": {
    icon: ListChecks,
    title: "Workflow completo até o fim",
    description: "Te guiamos de ponta a ponta: da ideia até a publicação. Cada etapa é clara e você sempre sabe o próximo passo.",
  },
  "Tenho ideias mas não executo": {
    icon: FileText,
    title: "Roteirização estruturada",
    description: "Transforme ideias em roteiros prontos para gravar. A Muzze te ajuda a tirar suas ideias da cabeça e colocar no papel.",
  },
  "Não sei por onde começar": {
    icon: Video,
    title: "Shot list organizado",
    description: "Saiba exatamente o que gravar em cada take. Nada de improvisar ou esquecer algo importante na gravação.",
  },
  "Me distraio facilmente": {
    icon: Scissors,
    title: "Timer integrado e foco total",
    description: "O timer da Muzze te mantém focado durante a criação. Sessões cronometradas eliminam distrações.",
  },
  "Perfeccionismo me paralisa": {
    icon: CheckCircle2,
    title: "Revisão antes de gravar",
    description: "Revise e refine seu roteiro antes da gravação. Isso reduz ansiedade e te dá confiança para criar.",
  },
};

export const Screen16PersonalizedFeatures = ({
  stickingPoints,
}: Screen16PersonalizedFeaturesProps) => {
  const relevantFeatures = stickingPoints
    .filter((point) => featureMap[point])
    .map((point) => ({ point, ...featureMap[point] }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">A Muzze foi feita pra você</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Baseado nos problemas que você enfrenta, estas funcionalidades vão te ajudar:
        </p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {relevantFeatures.length > 0 ? (
          relevantFeatures.map(({ point, icon: Icon, title, description }) => (
            <Card key={point} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{title}</h3>
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <p className="text-xs text-primary font-medium">
                    Resolve: "{point}"
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              A Muzze tem todas as ferramentas que você precisa para criar com consistência.
            </p>
          </Card>
        )}
      </div>

      <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
        <div className="text-center space-y-2">
          <p className="font-semibold">E tem muito mais:</p>
          <p className="text-sm text-muted-foreground">
            Calendário editorial, gamificação com XP e ofensivas, estatísticas detalhadas, 
            e um workflow que se adapta ao seu ritmo.
          </p>
        </div>
      </Card>
    </div>
  );
};
