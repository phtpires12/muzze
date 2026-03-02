import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  phase: number;
  totalPhases: number;
}

export const ProgressIndicator = ({
  progress,
  phase,
  totalPhases,
}: ProgressIndicatorProps) => {
  const phaseNames = [
    "Descoberta",
    "Diagnóstico",
    "Oportunidade",
    "Solução",
    "Compromisso",
    "Finalização",
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {phaseNames[phase]} ({phase + 1}/{totalPhases})
        </span>
        <span className="font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
