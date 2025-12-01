import { MultiSelectButtons } from "../../shared/MultiSelectButtons";
import { STICKING_POINTS } from "@/types/onboarding";

interface Screen4StickingPointsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const stickingPointOptions = STICKING_POINTS.map((point) => ({
  id: point,
  label: point,
}));

export const Screen4StickingPoints = ({
  value,
  onChange,
}: Screen4StickingPointsProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">O que mais te trava?</h2>
        <p className="text-muted-foreground">
          Escolha tudo que se aplica ao seu caso.
        </p>
      </div>

      <div className="flex justify-center">
        <MultiSelectButtons
          options={stickingPointOptions}
          selected={value}
          onChange={onChange}
          className="justify-center"
        />
      </div>
    </div>
  );
};
