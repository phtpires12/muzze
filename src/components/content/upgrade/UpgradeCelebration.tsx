import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUpgradeDetector } from '@/core/hooks';
import { useAnalytics } from '@/core/hooks';
import { ROUTES } from "@/routes/routes";

import {
  UpgradeWelcomeSlide,
  UpgradeUnlimitedSlide,
  UpgradeFeaturesSlide,
  UpgradeNextStepsSlide,
} from "./UpgradeCelebrationSlides";

const TOTAL_STEPS = 4;

export const UpgradeCelebration = () => {
  const { upgradedTo, dismiss, simulateUpgrade } = useUpgradeDetector();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  // Expose simulateUpgrade on window for DevTools
  useEffect(() => {
    (window as any).__simulateUpgrade = simulateUpgrade;
    return () => { delete (window as any).__simulateUpgrade; };
  }, [simulateUpgrade]);

  if (!upgradedTo) return null;

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      trackEvent('upgrade_celebration_step', { step: step + 1, plan: upgradedTo });
    } else {
      trackEvent('upgrade_celebration_completed', { plan: upgradedTo });
      dismiss({ persist: true });
      navigate(ROUTES.HOME);
    }
  };

  const slides = [
    <UpgradeWelcomeSlide planType={upgradedTo} />,
    <UpgradeUnlimitedSlide planType={upgradedTo} />,
    <UpgradeFeaturesSlide planType={upgradedTo} />,
    <UpgradeNextStepsSlide planType={upgradedTo} />,
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= step
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {slides[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA button */}
      <div className="px-6 pb-8 pt-4">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 rounded-xl"
        >
          {step < TOTAL_STEPS - 1 ? "Continuar" : "Começar a criar"}
        </Button>
      </div>
    </div>
  );
};
