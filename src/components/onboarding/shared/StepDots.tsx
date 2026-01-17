import { cn } from "@/lib/utils";

interface StepDotsProps {
  currentStep: number; // 0, 1, 2
  totalSteps: number;  // 3
}

export const StepDots = ({ currentStep, totalSteps }: StepDotsProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-300",
            index <= currentStep
              ? "bg-emerald-500"
              : "bg-gray-300 dark:bg-gray-600"
          )}
        />
      ))}
    </div>
  );
};
