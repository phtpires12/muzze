import { Card } from "@/components/ui/card";
import { BookOpen, Brain, Timer, TrendingUp } from "lucide-react";

interface Screen14TwentyFiveMinutesProps {}

export const Screen14TwentyFiveMinutes = ({}: Screen14TwentyFiveMinutesProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Timer className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">A ciência dos 25 minutos</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A Muzze não inventou um método novo. Ela operacionaliza princípios validados pela neurociência.
        </p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Timer className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Método Pomodoro (Francesco Cirillo)</h3>
              <p className="text-sm text-muted-foreground">
                Ciclos de <strong>25 minutos</strong> são ideais para vencer a resistência inicial 
                e entrar em estado de foco profundo.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Mais de 2 milhões de pessoas usam essa técnica diariamente.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Hábitos Atômicos (James Clear)</h3>
              <p className="text-sm text-muted-foreground">
                Hábitos consistentes surgem de <strong>micro-compromissos diários</strong>, 
                não de metas grandes e intimidadoras.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Livro com mais de 15 milhões de cópias vendidas mundialmente.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Ciclos Ultradianos (Huberman Lab)</h3>
              <p className="text-sm text-muted-foreground">
                Janelas de <strong>20-40 minutos</strong> são biologicamente ideais 
                para foco profundo sem exaustão mental.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Baseado em pesquisas do neurocientista Andrew Huberman (Stanford).
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Tiny Habits (BJ Fogg, Stanford)</h3>
              <p className="text-sm text-muted-foreground">
                Comportamentos sustentáveis surgem de <strong>ações pequenas, fáceis e repetidas</strong>, 
                não de força de vontade.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Método usado por milhares de pessoas para mudar comportamentos.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="text-center space-y-2">
          <p className="font-semibold">A Muzze combina tudo isso em uma experiência prática:</p>
          <p className="text-sm text-muted-foreground">
            25 minutos diários + workflow guiado + constância reforçada = criador consistente
          </p>
        </div>
      </Card>
    </div>
  );
};
