import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { GradientProgressBar } from "@/components/content/onboarding/shared/GradientProgressBar";
import { motion } from "framer-motion";

interface Screen8MonthsTryingProps {
  value: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export const Screen8MonthsTrying = ({ 
  value, 
  onChange, 
  onContinue, 
  onBack, 
  progress 
}: Screen8MonthsTryingProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value > 0) {
      onContinue();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      {/* Header: Back + Progress */}
      <div className="px-4 pt-12 sm:pt-16 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-violet-100 dark:hover:bg-muted transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-8">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-foreground"
        >
          Há quanto tempo você tá<br/>tentando criar?
        </motion.h1>
      </div>

      {/* Input + Helper + Button (bottom) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 pb-8 space-y-4"
      >
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          max="120"
          placeholder="Número de meses"
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          className="bg-violet-100/50 dark:bg-secondary/50 border-violet-200 dark:border-secondary h-14 rounded-xl text-lg text-center placeholder:text-muted-foreground"
          autoFocus
        />
        <p className="text-sm text-muted-foreground text-center">
          Isso nos ajuda a entender o tamanho do seu desafio.
        </p>
        <Button
          onClick={onContinue}
          disabled={value <= 0}
          variant="gradient-pill"
          size="lg"
          className="w-full"
        >
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
