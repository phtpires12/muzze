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
    <div className="flex flex-col items-center justify-between min-h-screen bg-violet-50 px-6 py-10 safe-area-inset-bottom">
      {/* Logo da folha Muzze - topo */}
      <div className="pt-2">
        <img
          src={muzzeLeaf}
          alt="Muzze"
          className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
        />
      </div>

      {/* iPhone Mockup com screenshot da home */}
      <div className="flex-1 flex items-center justify-center py-6">
        <PhoneMockup screenImage={homePreview} />
      </div>

      {/* Texto */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Organize sua Criatividade
        </h1>
        <p className="text-lg text-muted-foreground">
          com um app pensado para
        </p>
        <p className="text-xl font-semibold text-primary">
          Criadores de Conteúdo
        </p>
      </div>

      {/* Botões */}
      <div className="w-full max-w-xs space-y-4 pb-4">
        <Button
          onClick={onContinue}
          className="w-full h-14 rounded-full text-lg font-semibold shadow-lg shadow-primary/25"
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
