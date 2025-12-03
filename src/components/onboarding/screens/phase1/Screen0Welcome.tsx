import { Button } from "@/components/ui/button";
import muzzeLogo from "@/assets/muzze-logo.png";

interface Screen0WelcomeProps {
  onContinue: () => void;
}

export const Screen0Welcome = ({ onContinue }: Screen0WelcomeProps) => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="relative w-32 h-32 mx-auto mb-4">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-xl animate-pulse" />
        <img
          src={muzzeLogo}
          alt="Muzze Logo"
          className="relative w-32 h-32 object-contain rounded-2xl"
        />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Bem-vindo à Muzze.
        </h1>
        <p className="text-xl text-foreground">
          O app que organiza sua criatividade.
        </p>
      </div>
      <Button
        size="lg"
        onClick={onContinue}
        className="mt-6 h-14 px-12 text-lg"
      >
        Começar
      </Button>
    </div>
  );
};
