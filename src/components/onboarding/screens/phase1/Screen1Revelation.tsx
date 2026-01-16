import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const revelationCopy: Record<string, { headline: string; copy: string; emoji: string }> = {
  'cobrar-caro': {
    headline: 'Para cobrar muito mais caro, você precisa criar como quem já cobra caro',
    copy: 'Os creators que cobram preços premium não são mais talentosos que você. Eles criam diferente.',
    emoji: '💰'
  },
  'palestrar': {
    headline: 'Para ser convidado pra palestrar, você precisa criar como quem já é autoridade',
    copy: 'Os speakers reconhecidos não são mais inteligentes que você. Eles criam diferente.',
    emoji: '🎤'
  },
  'seguidores': {
    headline: 'Para ter milhares/milhões de seguidores, você precisa criar como quem já tem audiência',
    copy: 'Os grandes creators não são mais criativos que você. Eles criam diferente.',
    emoji: '📈'
  },
  'fila-espera': {
    headline: 'Para ter fila de espera, você precisa criar como quem já é disputado',
    copy: 'Os profissionais mais procurados não são mais competentes que você. Eles criam diferente.',
    emoji: '🚀'
  },
  'referencia': {
    headline: 'Para ser referência no seu nicho, você precisa criar como quem já é top of mind',
    copy: 'As autoridades do seu mercado não são mais experientes que você. Eles criam diferente.',
    emoji: '✨'
  }
};

// Default fallback content
const defaultContent = {
  headline: 'Para alcançar seu sonho, você precisa criar como quem já chegou lá',
  copy: 'Os creators de sucesso não são mais talentosos que você. Eles criam diferente.',
  emoji: '✨'
};

interface Screen1RevelationProps {
  selectedDream: string;
  onContinue: () => void;
}

export const Screen1Revelation = ({ selectedDream, onContinue }: Screen1RevelationProps) => {
  const content = revelationCopy[selectedDream] || defaultContent;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] animate-fade-in">
      {/* Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Large Emoji */}
        <div className="mb-8 animate-scale-in">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-5xl">
            {content.emoji}
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 animate-fade-in [animation-delay:100ms]">
          {content.headline}
        </h1>

        {/* Copy */}
        <p className="text-lg text-muted-foreground max-w-md animate-fade-in [animation-delay:200ms]">
          {content.copy}
        </p>
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
