import { Button } from "@/components/ui/button";
import { ChevronRight, Lightbulb, FileText, Video, BarChart3, X, Check } from "lucide-react";

interface Screen2ProcessProps {
  onContinue: () => void;
}

export const Screen2Process = ({ onContinue }: Screen2ProcessProps) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] animate-fade-in">
      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-center mb-8">
          Eles seguem um processo criativo específico
        </h1>

        {/* Workflow Visual */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between gap-2">
            {/* Step 1: Ideação */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Ideação
              </span>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Step 2: Roteiro */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Roteiro
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Step 3: Produção */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Produção
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Step 4: Análise */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Análise
              </span>
            </div>
          </div>
        </div>

        {/* 3 Points */}
        <div className="space-y-4">
          {/* Point 1 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <X className="w-5 h-5 text-destructive" strokeWidth={2} />
            </div>
            <p className="text-base text-muted-foreground">
              Não é sobre ter mais tempo
            </p>
          </div>

          {/* Point 2 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <X className="w-5 h-5 text-destructive" strokeWidth={2} />
            </div>
            <p className="text-base text-muted-foreground">
              Não é sobre ter mais ideias
            </p>
          </div>

          {/* Point 3 - Highlight */}
          <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-xl p-4 -mx-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <p className="text-base font-medium text-foreground">
              É sobre ter um <span className="text-primary font-bold">SISTEMA</span> que funciona, todo santo dia
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="px-6 pb-6 pt-4">
        <Button 
          onClick={onContinue}
          size="lg"
          className="w-full h-12 text-base font-semibold"
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-1" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
};
