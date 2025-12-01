import { Button } from "@/components/ui/button";
import greekStatue from "@/assets/greek-statue.png";

interface Screen0WelcomeProps {
  onContinue: () => void;
}

export const Screen0Welcome = ({ onContinue }: Screen0WelcomeProps) => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <img
        src={greekStatue}
        alt="Estátua grega"
        className="w-40 h-40 mx-auto object-contain mb-4"
      />
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
