import { Check, Crown, Infinity, Calendar, Users, Sparkles, ArrowRight } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { Confetti } from "@/components/Confetti";

interface SlideProps {
  planType: 'pro' | 'studio';
}

export const UpgradeWelcomeSlide = ({ planType }: SlideProps) => {
  const planLabel = planType === 'studio' ? 'Studio' : 'Pro';

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 min-h-[60vh]">
      <Confetti count={60} />
      
      {/* Animated logo */}
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl animate-pulse" />
        <div className="relative w-28 h-28 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl">
          <img src={muzzeLeafWhite} alt="Muzze" className="w-14 h-14 object-contain" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background shadow-lg">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Parabéns! 🎉
      </h1>
      <p className="text-xl font-semibold text-primary mb-2">
        Agora você é {planLabel}!
      </p>
      <p className="text-muted-foreground max-w-xs">
        Seu upgrade foi ativado com sucesso. Veja o que você desbloqueou.
      </p>
    </div>
  );
};

export const UpgradeUnlimitedSlide = ({ planType }: SlideProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 min-h-[60vh]">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <Infinity className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-3">
        Conteúdos ilimitados
      </h2>
      <p className="text-muted-foreground max-w-xs text-lg">
        Sem limite semanal. Crie quantos conteúdos quiser, quando quiser.
      </p>

      <div className="mt-8 px-6 py-4 rounded-xl bg-primary/5 border border-primary/20 max-w-xs">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-left">
            Antes: <span className="line-through text-muted-foreground">3 por semana</span>
            <br />
            Agora: <span className="font-semibold text-primary">Ilimitado ∞</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const UpgradeFeaturesSlide = ({ planType }: SlideProps) => {
  const features = planType === 'studio'
    ? [
        { icon: Calendar, title: "Planejamento futuro", desc: "Agende conteúdos para qualquer data" },
        { icon: Users, title: "5 workspaces", desc: "Gerencie múltiplos projetos" },
        { icon: Crown, title: "4 colaboradores", desc: "Por workspace, trabalhe em equipe" },
      ]
    : [
        { icon: Calendar, title: "Planejamento futuro", desc: "Agende conteúdos para qualquer data" },
        { icon: Users, title: "Colaboradores", desc: "Convide até 3 pessoas para seu workspace" },
        { icon: Crown, title: "Recursos premium", desc: "Acesso a todas as funcionalidades" },
      ];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold tracking-tight mb-8">
        Recursos desbloqueados
      </h2>

      <div className="space-y-4 w-full max-w-sm">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border text-left">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const UpgradeNextStepsSlide = ({ planType }: SlideProps) => {
  const steps = [
    "Crie seu primeiro conteúdo da semana",
    "Explore o calendário editorial",
    "Convide sua equipe para colaborar",
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 min-h-[60vh]">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <ArrowRight className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Próximos passos
      </h2>
      <p className="text-muted-foreground mb-8">
        Sugestões para começar com tudo
      </p>

      <div className="space-y-3 w-full max-w-sm mb-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 text-left">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
