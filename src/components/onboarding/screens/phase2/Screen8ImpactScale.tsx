import { ScaleSelector } from "../../shared/ScaleSelector";
import { Card } from "@/components/ui/card";

interface Screen8ImpactScaleProps {
  value: {
    financial: number;
    emotional: number;
    professional: number;
  };
  onChange: (value: { financial: number; emotional: number; professional: number }) => void;
}

export const Screen8ImpactScale = ({
  value,
  onChange,
}: Screen8ImpactScaleProps) => {
  const handleChange = (field: keyof typeof value, newValue: number) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Qual o impacto disso na sua vida?</h2>
        <p className="text-muted-foreground">
          Avalie de 1 a 5 como a falta de consistência te afeta em cada área.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <ScaleSelector
            label="💰 Impacto financeiro"
            value={value.financial}
            onChange={(v) => handleChange("financial", v)}
            minLabel="Nenhum"
            maxLabel="Muito alto"
          />
        </Card>

        <Card className="p-6">
          <ScaleSelector
            label="😔 Impacto emocional"
            value={value.emotional}
            onChange={(v) => handleChange("emotional", v)}
            minLabel="Nenhum"
            maxLabel="Muito alto"
          />
        </Card>

        <Card className="p-6">
          <ScaleSelector
            label="📈 Impacto profissional"
            value={value.professional}
            onChange={(v) => handleChange("professional", v)}
            minLabel="Nenhum"
            maxLabel="Muito alto"
          />
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center pt-4">
        Essas informações nos ajudam a personalizar sua experiência.
      </p>
    </div>
  );
};
