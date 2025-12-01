import { MultiSelectButtons } from "../../shared/MultiSelectButtons";
import { PREVIOUS_ATTEMPTS } from "@/types/onboarding";

interface Screen7PreviousAttemptsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const attemptOptions = PREVIOUS_ATTEMPTS.map((attempt) => ({
  id: attempt,
  label: attempt,
}));

export const Screen7PreviousAttempts = ({
  value,
  onChange,
}: Screen7PreviousAttemptsProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">O que você já tentou?</h2>
        <p className="text-muted-foreground">
          Marque tudo que você já usou para tentar ser mais consistente.
        </p>
      </div>

      <div className="flex justify-center">
        <MultiSelectButtons
          options={attemptOptions}
          selected={value}
          onChange={onChange}
          className="justify-center"
        />
      </div>
    </div>
  );
};
