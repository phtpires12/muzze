import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingCard } from "../../shared/OnboardingCard";

interface Screen1MethodologyProps {
  onContinue: () => void;
}

export const Screen1Methodology = ({ onContinue }: Screen1MethodologyProps) => {
  const [visibleCards, setVisibleCards] = useState(1);

  useEffect(() => {
    setVisibleCards(1);
  }, []);

  const handleTap = () => {
    if (visibleCards < 3) {
      setVisibleCards((v) => v + 1);
    }
  };

  return (
    <div
      className={`space-y-8 animate-fade-in ${
        visibleCards < 3 ? "cursor-pointer" : ""
      }`}
      onClick={handleTap}
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Como a Muzze vai te ajudar</h2>
      </div>

      <div className="space-y-6">
        {/* Card 1 - Constância diária */}
        {visibleCards >= 1 && (
          <OnboardingCard
            icon="🌱"
            title="Constância diária"
            description="A Muzze foi criada para te ajudar a criar um pouco todos os dias, sem pressão e sem perfeccionismo."
          />
        )}

        {/* Card 2 - Minutos, não posts */}
        {visibleCards >= 2 && (
          <OnboardingCard
            icon="⏰"
            title="Minutos, não posts"
            description="Nós medimos seu progresso pelo tempo criando, não pela quantidade de publicações."
          />
        )}

        {/* Card 3 - Sessões criativas */}
        {visibleCards >= 3 && (
          <OnboardingCard
            icon="⏱️"
            title="Sessões criativas"
            description="Você escolhe a etapa do seu processo (ideias, roteiro, revisão, gravação ou edição), inicia uma sessão e cria com foco total."
          />
        )}
      </div>

      {visibleCards < 3 && (
        <p className="text-center text-sm text-muted-foreground animate-pulse pt-4">
          Toque para continuar
        </p>
      )}

      {visibleCards === 3 && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            size="lg"
            className="min-w-[300px]"
          >
            Entendi, quero criar todos os dias
          </Button>
        </div>
      )}
    </div>
  );
};
