import { Input } from "@/components/ui/input";

interface Screen2UsernameProps {
  value: string;
  onChange: (value: string) => void;
}

export const Screen2Username = ({ value, onChange }: Screen2UsernameProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Como você gostaria de ser chamado?</h2>
        <p className="text-muted-foreground">
          Esse nome aparecerá no seu perfil.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Input
          placeholder="Seu nome"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg h-14 text-center"
          autoFocus
          maxLength={50}
        />
      </div>
    </div>
  );
};
