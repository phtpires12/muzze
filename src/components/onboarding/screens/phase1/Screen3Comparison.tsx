import { Button } from "@/components/ui/button";
import { ArrowRight, X, Check, Lightbulb, FileText, Video, BarChart3 } from "lucide-react";

interface Screen3ComparisonProps {
  onContinue: () => void;
}

export const Screen3Comparison = ({ onContinue }: Screen3ComparisonProps) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] animate-fade-in">
      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-4 gap-5">
        {/* "WRONG" Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-4 h-4 text-destructive" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Criadores do topo não criam assim:
            </p>
          </div>

          {/* Chaotic Visual */}
          <div className="relative h-32 bg-muted/30 overflow-hidden">
            {/* Scattered elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-3 left-4 w-8 h-8 rounded-lg bg-muted rotate-12 opacity-60" />
              <div className="absolute top-8 right-8 w-10 h-10 rounded-lg bg-muted -rotate-6 opacity-50" />
              <div className="absolute bottom-4 left-1/4 w-6 h-6 rounded-lg bg-muted rotate-45 opacity-40" />
              <div className="absolute bottom-6 right-1/3 w-12 h-6 rounded-lg bg-muted -rotate-12 opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted rotate-3 opacity-60" />
            </div>

            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-destructive/5 to-transparent" />
          </div>
        </div>

        {/* "RIGHT" Card */}
        <div className="bg-card border-2 border-primary/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-primary/20">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-foreground">
              Eles criam assim:
            </p>
          </div>

          {/* Organized Visual */}
          <div className="relative p-4 bg-primary/5">
            {/* Organized steps */}
            <div className="flex items-center justify-between gap-2">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="w-6 h-1 rounded-full bg-primary/30" />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="w-6 h-1 rounded-full bg-primary/30" />
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="w-6 h-1 rounded-full bg-primary/30" />
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="w-6 h-1 rounded-full bg-primary/30" />
              </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Conclusion Copy */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-5 text-center">
          <p className="text-lg font-semibold text-foreground">
            A Muzze transforma você no segundo tipo
          </p>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="px-6 pb-6 pt-4">
        <Button 
          onClick={onContinue}
          variant="gradient"
          size="lg"
          className="w-full h-12 text-base font-semibold"
        >
          Vamos começar
          <ArrowRight className="w-5 h-5 ml-1" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
};
