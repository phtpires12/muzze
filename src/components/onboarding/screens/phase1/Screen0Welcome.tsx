import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/onboarding/shared/PhoneMockup";
import { AuroraBackground } from "@/components/ui/aurora-background";
import muzzeLogo from "@/assets/muzze-logo.png";

interface Screen0WelcomeProps {
  onContinue: () => void;
  onLogin: () => void;
}

export const Screen0Welcome = ({ onContinue, onLogin }: Screen0WelcomeProps) => {
  return (
    <AuroraBackground 
      variant="full" 
      intensity="medium" 
      animated={true}
      className="min-h-[calc(100vh-120px)]"
    >
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 animate-fade-in">
        {/* Logo at top */}
        <div className="mb-6">
          <img
            src={muzzeLogo}
            alt="Muzze Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
          />
        </div>

        {/* Phone Mockup */}
        <div className="mb-8">
          <PhoneMockup />
        </div>

        {/* Text content */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Bem-vindo à Muzze.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            O app que organiza sua criatividade.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            size="lg"
            onClick={onContinue}
            className="w-full h-14 text-lg font-semibold"
          >
            Começar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogin}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Já tem uma conta? Entre!
          </Button>
        </div>
      </div>
    </AuroraBackground>
  );
};
