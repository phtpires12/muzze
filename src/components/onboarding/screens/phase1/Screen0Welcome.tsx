import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/onboarding/shared/PhoneMockup";
import muzzeLeaf from "@/assets/muzze-leaf-gradient.png";
import homePreview from "@/assets/home-preview-mobile.png";

interface Screen0WelcomeProps {
  onContinue: () => void;
  onLogin: () => void;
}

export const Screen0Welcome = ({ onContinue, onLogin }: Screen0WelcomeProps) => {
  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] bg-violet-50 px-6 py-6 overflow-hidden">
      {/* Logo da folha Muzze - topo */}
      <div className="pt-2 shrink-0">
        <img
          src={muzzeLeaf}
          alt="Muzze"
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
      </div>

      {/* iPhone Mockup com screenshot da home - flexível, pode encolher */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-0">
        <PhoneMockup 
          screenImage={homePreview} 
          className="w-[180px] sm:w-[260px] h-auto max-h-full"
        />
      </div>

      {/* Texto */}
      <div className="text-center space-y-0.5 shrink-0">
        <h1 className="text-xl sm:text-3xl font-bold text-foreground">
          Organize sua Criatividade
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          com um app pensado para
        </p>
        <p className="text-lg sm:text-xl font-semibold text-primary">
          Criadores de Conteúdo
        </p>
      </div>

      {/* Botões */}
      <div className="w-full max-w-xs space-y-3 shrink-0 pt-4 pb-safe">
        <Button
          onClick={onContinue}
          className="w-full h-12 sm:h-14 rounded-full text-base sm:text-lg font-semibold shadow-lg shadow-primary/25"
        >
          Começar
        </Button>
        <button
          onClick={onLogin}
          className="w-full text-center text-muted-foreground text-sm"
        >
          Já tem uma conta? <span className="font-semibold text-primary">Entrar</span>
        </button>
      </div>
    </div>
  );
};
