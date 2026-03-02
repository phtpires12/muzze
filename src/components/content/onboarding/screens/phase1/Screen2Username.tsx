import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { GradientProgressBar } from "@/components/content/onboarding/shared/GradientProgressBar";

interface Screen2UsernameProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export const Screen2Username = ({ 
  value, 
  onChange, 
  onContinue, 
  onBack, 
  progress 
}: Screen2UsernameProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onContinue();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-secondary/30 dark:bg-background flex flex-col">
      {/* Header: Back + Progress */}
      <div className="px-4 pt-4 sm:pt-6 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-12 sm:pt-16">
        <p className="text-muted-foreground text-base">Mas antes disso,</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">
          Como podemos te chamar?
        </h1>
      </div>

      {/* Input + Button (bottom) */}
      <div className="px-6 pb-8 space-y-4">
        <Input
          placeholder="Nome"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-secondary/50 dark:bg-muted border-secondary h-14 rounded-xl text-lg text-center"
          autoFocus
          maxLength={50}
        />
        <Button
          onClick={onContinue}
          disabled={!value.trim()}
          className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
