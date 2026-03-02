import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";

interface OnboardingLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showProgress?: boolean;
  progress?: number;
  phase?: number;
  totalPhases?: number;
}

export const OnboardingLayout = ({
  children,
  showBack = false,
  onBack,
  showProgress = true,
  progress = 0,
  phase = 0,
  totalPhases = 6,
}: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back button */}
      {showBack && (
        <div className="p-4 sm:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl space-y-8">
          {children}
        </div>
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="p-4 sm:p-6 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <ProgressIndicator
              progress={progress}
              phase={phase}
              totalPhases={totalPhases}
            />
          </div>
        </div>
      )}
    </div>
  );
};
