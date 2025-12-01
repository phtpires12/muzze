import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Screen5MonthsTryingProps {
  value: number;
  onChange: (value: number) => void;
}

export const Screen5MonthsTrying = ({
  value,
  onChange,
}: Screen5MonthsTryingProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Há quanto tempo você tenta?</h2>
        <p className="text-muted-foreground">
          Há quantos meses você tenta ser consistente sem conseguir?
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <Label htmlFor="months-trying" className="text-center block">
          Número de meses
        </Label>
        <Input
          id="months-trying"
          type="number"
          min="0"
          max="120"
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder="Ex: 6"
          className="text-lg h-14 text-center"
          autoFocus
        />
        <p className="text-sm text-muted-foreground text-center">
          Isso nos ajuda a entender o tamanho do seu desafio.
        </p>
      </div>
    </div>
  );
};
