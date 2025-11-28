import { Sparkles, Users, Workflow, Calendar, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NovidadeItem {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
}

const novidades: NovidadeItem[] = [
  {
    id: "1",
    badge: "EM BREVE",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    title: "Comunidade CreatorFlow",
    description: "Conecte-se com outros criadores, compartilhe ideias e inspire-se. A comunidade CreatorFlow está chegando para transformar sua experiência criativa!",
    icon: Users,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "2",
    badge: "NOVIDADE",
    badgeColor: "bg-gradient-to-r from-orange-500 to-yellow-500",
    title: "Workflows Personalizados",
    description: "Escolha entre 3 workflows especializados: Executor (para quem tem muitas ideias), Idealizador (para quem precisa de inspiração) e Desenvolvedor (para transformar ideias em roteiros completos).",
    icon: Workflow,
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    id: "3",
    badge: "EM DESENVOLVIMENTO",
    badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
    title: "Calendário Editorial Inteligente",
    description: "Planeje seu conteúdo com inteligência artificial. O novo calendário sugere os melhores dias para publicar baseado no seu histórico e engajamento.",
    icon: Calendar,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "4",
    badge: "PRÓXIMA ATUALIZAÇÃO",
    badgeColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    title: "Análise de Performance",
    description: "Descubra quais tipos de conteúdo performam melhor e receba sugestões personalizadas para otimizar seu processo criativo.",
    icon: Sparkles,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "5",
    badge: "BETA FECHADO",
    badgeColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
    title: "Assistente IA de Roteiros",
    description: "Um assistente inteligente que ajuda você a desenvolver roteiros completos a partir de uma simples ideia. Teste em breve no beta fechado!",
    icon: Rocket,
    gradient: "from-indigo-500 to-purple-500",
  },
];

const Novidades = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Melhorias de Futuras Atualizações</h1>
          <p className="text-muted-foreground">
            Confira as sugestões de melhoria que nossos usuários nos deram
          </p>
        </div>

        <div className="space-y-4">
          {novidades.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={item.id}
                className="overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`${item.badgeColor} text-white border-0 text-xs font-bold px-3 py-1`}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Sugestões e Feedback
              </h4>
              <p className="text-sm text-muted-foreground">
                Tem alguma sugestão de feature? Acesse a página de Ajustes e envie suas
                ideias para nós!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Novidades;
