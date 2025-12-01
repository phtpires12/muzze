import { ScaleSelector } from "../../shared/ScaleSelector";
import { Card } from "@/components/ui/card";

interface Screen13DreamOutcomeProps {
  value: {
    posts_30_days: number;
    clarity: number;
    consistent_identity: number;
  };
  onChange: (value: {
    posts_30_days: number;
    clarity: number;
    consistent_identity: number;
  }) => void;
}

export const Screen13DreamOutcome = ({
  value,
  onChange,
}: Screen13DreamOutcomeProps) => {
  const handleChange = (
    field: keyof typeof value,
    newValue: number
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">O quanto isso importa pra você?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Avalie de 1 a 5 o quanto cada resultado seria importante na sua vida.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <ScaleSelector
            label="📊 Postar 30 vezes em 30 dias"
            value={value.posts_30_days}
            onChange={(v) => handleChange("posts_30_days", v)}
            minLabel="Pouco importante"
            maxLabel="Muito importante"
          />
        </Card>

        <Card className="p-6">
          <ScaleSelector
            label="💡 Ter clareza total sobre o que criar"
            value={value.clarity}
            onChange={(v) => handleChange("clarity", v)}
            minLabel="Pouco importante"
            maxLabel="Muito importante"
          />
        </Card>

        <Card className="p-6">
          <ScaleSelector
            label="🎯 Ser conhecido como criador consistente"
            value={value.consistent_identity}
            onChange={(v) => handleChange("consistent_identity", v)}
            minLabel="Pouco importante"
            maxLabel="Muito importante"
          />
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center pt-4">
        Suas respostas nos ajudam a personalizar sua experiência na Muzze.
      </p>
    </div>
  );
};
