import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface OnboardingLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showProgress?: boolean;
  progress?: number;
  phase?: number;
  totalPhases?: number;
  showAurora?: boolean;
}

export const OnboardingLayout = ({
  children,
  showBack = false,
  onBack,
  showProgress = true,
  progress = 0,
  phase = 0,
  totalPhases = 6,
  showAurora = false,
}: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Aurora background for special screens */}
      {showAurora && (
        <AuroraBackground 
          variant="top" 
          intensity="subtle" 
          animated={false}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* Header with back button */}
      {showBack && (
        <div className="p-4 sm:p-6 relative z-10">
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          {children}
        </div>
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="p-4 sm:p-6 border-t border-border relative z-10">
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
