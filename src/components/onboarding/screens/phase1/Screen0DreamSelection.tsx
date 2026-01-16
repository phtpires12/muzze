import { useState } from "react";
import { Check } from "lucide-react";

interface DreamOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const dreamOptions: DreamOption[] = [
  {
    id: 'cobrar-caro',
    emoji: '💰',
    title: 'Cobrar muito mais caro',
    description: 'Ser tão valorizado que você pode cobrar preços premium',
  },
  {
    id: 'palestrar',
    emoji: '🎤',
    title: 'Ser convidado pra palestrar',
    description: 'Ser reconhecido como autoridade e receber convites',
  },
  {
    id: 'seguidores',
    emoji: '📈',
    title: 'Ter milhares/milhões de seguidores',
    description: 'Construir uma audiência grande que te acompanha',
  },
  {
    id: 'fila-espera',
    emoji: '🚀',
    title: 'Ter fila de espera',
    description: 'Que as pessoas briguem pra trabalhar com você',
  },
  {
    id: 'referencia',
    emoji: '✨',
    title: 'Ser referência no seu nicho',
    description: 'Quando falarem do seu tema, pensarem em você primeiro',
  }
];

interface Screen0DreamSelectionProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}

export const Screen0DreamSelection = ({ value, onChange, onContinue }: Screen0DreamSelectionProps) => {
  const handleSelect = (dreamId: string) => {
    onChange(dreamId);
    // Auto-advance after 400ms
    setTimeout(() => {
      onContinue();
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 pt-4">
        {/* Headline */}
        <h1 className="text-3xl font-bold text-foreground tracking-tight text-center mb-2">
          Onde você quer chegar?
        </h1>
        
        {/* Subtitle */}
        <p className="text-muted-foreground text-center mb-6">
          Escolha o resultado que mais importa pra você agora
        </p>

        {/* Dream Options */}
        <div className="flex flex-col gap-3">
          {dreamOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`
                w-full p-5 bg-card border text-left 
                rounded-xl transition-all duration-200 
                hover:scale-[1.02] active:scale-[0.98]
                hover:shadow-md
                group
                ${value === option.id 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-border/80'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Emoji Icon */}
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                  {option.emoji}
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
                
                {/* Selection Indicator */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {value === option.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
