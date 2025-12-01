import { PlatformSelector } from "../../shared/PlatformSelector";

interface Screen3PlatformProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const Screen3Platform = ({ value, onChange }: Screen3PlatformProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Onde você publica?</h2>
        <p className="text-muted-foreground">
          Escolha uma ou mais plataformas principais.
        </p>
      </div>

      <PlatformSelector selected={value} onChange={onChange} multiSelect />
    </div>
  );
};
