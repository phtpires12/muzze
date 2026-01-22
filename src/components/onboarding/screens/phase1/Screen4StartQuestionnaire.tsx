import { Button } from "@/components/ui/button";
import { ArrowRight, Cog, Brain, Flame } from "lucide-react";

interface Screen4StartQuestionnaireProps {
  onContinue: () => void;
}

export const Screen4StartQuestionnaire = ({ onContinue }: Screen4StartQuestionnaireProps) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-[70vh] w-full max-w-md mx-auto px-4 py-6">
      {/* Cards Section */}
      <div className="w-full space-y-4 flex-1 flex flex-col justify-center">
        {/* Card: Sua evolução criativa */}
        <div className="bg-card rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transform -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Sua evolução criativa</h3>
            <div className="flex items-center gap-1">
              <span className="text-lg">⚙️</span>
              <span className="text-lg">🧠</span>
              <span className="text-lg">🔥</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-3">
            <div 
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent via-warning to-destructive"
              style={{ width: '35%' }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Seu ritmo atual vs seu ritmo ideal
          </p>
          
          {/* Comparison bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">Atual</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-warning rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">Ideal</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Seu plano */}
        <div className="bg-card rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transform rotate-1">
          <h3 className="text-base font-semibold text-foreground mb-4">Seu plano</h3>
          
          {/* Timeline */}
          <div className="relative pl-8 space-y-4">
            {/* Vertical line */}
            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />
            
            {/* Phase 0: Organização */}
            <div className="relative">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Cog className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Fase 0: Organização</p>
                <div className="mt-1 space-y-1">
                  <div className="h-2 w-3/4 bg-muted rounded" />
                  <div className="h-2 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </div>
            
            {/* Phase 1: Habituação */}
            <div className="relative">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">Fase 1: Habituação</p>
                <div className="mt-1 space-y-1">
                  <div className="h-2 w-2/3 bg-muted rounded" />
                  <div className="h-2 w-1/3 bg-muted rounded" />
                </div>
              </div>
            </div>
            
            {/* Phase 2: Reconhecimento */}
            <div className="relative">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">Fase 2: Reconhecimento</p>
                <div className="mt-1 space-y-1">
                  <div className="h-2 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-1/4 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full space-y-4 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Vamos criar seu{" "}
            <span className="text-primary">plano de criação</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Em 3 minutos, vamos entender onde você está e desenhar um sistema de criação que se encaixa na sua rotina.
          </p>
        </div>
        
        <Button
          onClick={onContinue}
          className="w-full h-12 rounded-full shadow-lg shadow-primary/25 gap-2"
        >
          Construir meu novo sistema
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
