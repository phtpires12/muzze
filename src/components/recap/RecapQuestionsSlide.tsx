import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RecapQuestionsSlideProps {
  onSubmit: (followers: number, hadViral: boolean) => void;
  initialFollowers?: number | null;
  initialHadViral?: boolean | null;
}

export const RecapQuestionsSlide = ({ 
  onSubmit, 
  initialFollowers, 
  initialHadViral 
}: RecapQuestionsSlideProps) => {
  const [followers, setFollowers] = useState<string>(initialFollowers?.toString() || '');
  const [hadViral, setHadViral] = useState<boolean | null>(initialHadViral ?? null);

  const canContinue = followers.trim() !== '' && hadViral !== null;

  const handleSubmit = () => {
    if (canContinue) {
      onSubmit(parseInt(followers, 10), hadViral!);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-5xl mb-4"
          >
            📊
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Antes de começar...
          </h2>
          <p className="text-sm text-muted-foreground">
            Responda rápido para personalizarmos seu recap
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Label htmlFor="followers" className="text-sm font-medium">
            Com quantos seguidores você terminou este mês?
          </Label>
          <Input
            id="followers"
            type="number"
            placeholder="Ex: 5000"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            className="text-lg h-12"
          />
          <p className="text-xs text-muted-foreground">
            Pode ser aproximado, de qualquer plataforma
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Label className="text-sm font-medium">
            Você viralizou algum conteúdo recentemente?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHadViral(true)}
              className={cn(
                "py-4 px-6 rounded-xl border-2 text-center font-medium transition-all",
                hadViral === true
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-muted-foreground"
              )}
            >
              <span className="text-2xl block mb-1">🚀</span>
              Sim
            </button>
            <button
              type="button"
              onClick={() => setHadViral(false)}
              className={cn(
                "py-4 px-6 rounded-xl border-2 text-center font-medium transition-all",
                hadViral === false
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-muted-foreground"
              )}
            >
              <span className="text-2xl block mb-1">🌱</span>
              Não
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Viralizar não é o único caminho para o sucesso! 💪
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-4"
        >
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            disabled={!canContinue}
          >
            Ver meu recap
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
