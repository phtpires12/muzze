import { Card } from "@/components/ui/card";
import { Coffee, Zap, CheckCircle2 } from "lucide-react";

interface Screen15MinimalEffortProps {}

export const Screen15MinimalEffort = ({}: Screen15MinimalEffortProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Coffee className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">25 minutos é menos do que parece</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          É um tempo tão pequeno que seu cérebro nem consegue resistir.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 bg-gradient-to-br from-accent/5 to-primary/5">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              25 minutos
            </div>
            <p className="text-xl">É menos tempo do que você gasta:</p>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">Assistindo a um episódio de série</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">Scrollando no Instagram sem perceber</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">Procrastinando e tentando "encontrar inspiração"</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">Tomando café e pensando no que fazer</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="font-semibold">O segredo não é ter mais tempo</p>
              <p className="text-sm text-muted-foreground">
                É usar <strong>apenas 25 minutos do tempo que você já tem</strong> de forma focada e consistente. 
                Todo dia. Sem exceção. E a Muzze te guia nesse processo.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
