import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { motion } from "framer-motion";

interface Screen13CreationTimeProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen13CreationTime = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen13CreationTimeProps) => {
  const firstName = username?.split(" ")[0] || "";

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
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-8"
        >
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {firstName ? `${firstName}, qual melhor` : "Qual melhor"}
            <br />
            horário pra você criar?
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha o momento do dia em que você tem mais energia criativa.
          </p>
        </motion.div>

        {/* Time Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <Input
            type="time"
            value={value || "09:00"}
            onChange={(e) => onChange(e.target.value)}
            className="text-2xl h-16 w-40 text-center font-medium 
              bg-white dark:bg-secondary/50 border-2 border-violet-200 
              dark:border-violet-800 rounded-2xl focus:border-primary 
              focus:ring-primary"
          />
        </motion.div>

        {/* Tip Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Card className="p-4 bg-violet-100/50 dark:bg-violet-900/20 border-0">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">💡 Dica:</p>
              <p className="text-muted-foreground leading-relaxed">
                Escolha um horário em que você geralmente está livre e com energia. 
                Manhã cedo funciona bem para muitos criadores, mas o importante é 
                ser consistente com o horário escolhido.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Continue Button - always visible since time has default value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 pb-8 pt-4"
      >
        <Button
          onClick={onContinue}
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
