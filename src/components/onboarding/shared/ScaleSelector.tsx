import { cn } from "@/lib/utils";

interface ScaleSelectorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export const ScaleSelector = ({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel,
  maxLabel,
  className,
}: ScaleSelectorProps) => {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <p className="font-medium mb-4">{label}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        {minLabel && (
          <span className="text-xs text-muted-foreground text-center min-w-[60px]">
            {minLabel}
          </span>
        )}
        
        <div className="flex-1 flex items-center justify-center gap-2">
          {steps.map((step) => (
            <button
              key={step}
              onClick={() => onChange(step)}
              className={cn(
                "w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center font-semibold",
                value === step
                  ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                  : "border-border hover:border-primary/50 hover:scale-105"
              )}
            >
              {step}
            </button>
          ))}
        </div>

        {maxLabel && (
          <span className="text-xs text-muted-foreground text-center min-w-[60px]">
            {maxLabel}
          </span>
        )}
      </div>
    </div>
  );
};
