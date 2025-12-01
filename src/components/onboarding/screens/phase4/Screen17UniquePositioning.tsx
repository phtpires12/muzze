import { Card } from "@/components/ui/card";
import { Target, Users, X, Sparkles } from "lucide-react";

interface Screen17UniquePositioningProps {}

export const Screen17UniquePositioning = ({}: Screen17UniquePositioningProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">O primeiro app pensado pra você</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enquanto outros apps tentam ser tudo para todos, a Muzze foi criada especificamente 
          para criadores de conteúdo solo que lutam com constância.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-destructive" />
            O que a Muzze NÃO é:
          </h3>
          <div className="space-y-3">
            <Card className="p-4 bg-destructive/5 border-destructive/20">
              <p className="text-sm">
                <strong>Não é o Notion:</strong> Generalista demais, sem foco em criação de conteúdo
              </p>
            </Card>
            <Card className="p-4 bg-destructive/5 border-destructive/20">
              <p className="text-sm">
                <strong>Não é o Trello:</strong> Feito para gestão de projetos complexos, não criação diária
              </p>
            </Card>
            <Card className="p-4 bg-destructive/5 border-destructive/20">
              <p className="text-sm">
                <strong>Não é um curso:</strong> Você não precisa de mais teoria, precisa de prática guiada
              </p>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            O que a Muzze É:
          </h3>
          <div className="space-y-3">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">Feita para criadores solo</p>
                  <p className="text-xs text-muted-foreground">
                    Não para equipes. Não para empresas. Para você, que cria sozinho.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">Focada em constância</p>
                  <p className="text-xs text-muted-foreground">
                    Não em velocidade. Não em viralização. Em criar um pouco, todos os dias.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">Workflow completo integrado</p>
                  <p className="text-xs text-muted-foreground">
                    Da ideação até a gravação, tudo em um só lugar, com timer e gamificação.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="text-center space-y-2">
            <p className="font-semibold text-lg">
              A Muzze existe porque você existe
            </p>
            <p className="text-sm text-muted-foreground">
              Criadores solo precisam de ferramentas específicas, não de adaptações genéricas.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
