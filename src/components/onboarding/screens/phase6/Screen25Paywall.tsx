import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import mockupHome from "@/assets/paywall/mockup-home.png";
import mockupCalendar from "@/assets/paywall/mockup-calendar.png";
import mockupStats from "@/assets/paywall/mockup-stats.png";
import mockupOfensiva from "@/assets/paywall/mockup-ofensiva.png";
import muzzeLeaf from "@/assets/paywall/muzze-leaf-gradient.png";

interface Screen25PaywallProps {
  onContinue: () => void;
  onBack?: () => void;
  showDevSkip?: boolean;
  onDevSkip?: () => void;
}

const MOCKUP_IMAGES = [mockupHome, mockupCalendar, mockupStats, mockupOfensiva];

export const Screen25Paywall = ({
  onContinue,
  onBack,
  showDevSkip,
  onDevSkip,
}: Screen25PaywallProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCKUP_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] bg-violet-50 dark:bg-background flex flex-col px-6 py-4 safe-area-inset overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        {showDevSkip && onDevSkip ? (
          <button
            className="flex items-center gap-1 text-xs text-primary underline underline-offset-2"
            onClick={onDevSkip}
          >
            <Shield className="w-3 h-3" />
            Pular (Dev)
          </button>
        ) : (
          <div />
        )}
        <button
          className="text-xs text-muted-foreground underline underline-offset-2"
          onClick={() => {/* TODO: restore purchase logic */}}
        >
          Restaurar compra
        </button>
      </div>

      {/* Logo */}
      <div className="flex justify-center mt-1">
        <img src={muzzeLeaf} alt="Muzze" className="w-10 h-10 object-contain" />
      </div>

      {/* Title */}
      <div className="text-center mt-1 mb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Experimente a Muzze<br />gratuitamente.
        </h1>
      </div>

      {/* Mockup images - section with controlled height, overflow clips naturally */}
      <section className="flex-1 max-h-[55vh] overflow-hidden relative z-0 flex items-center justify-center min-h-0 -mt-16">
        <div className="relative w-[280px] sm:w-[320px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={MOCKUP_IMAGES[currentIndex]}
              alt="App preview"
              className="w-full h-auto object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              draggable={false}
            />
          </AnimatePresence>
        </div>
      </section>

      {/* Bottom CTA - solid background, always above mockup */}
      <section className="relative z-10 bg-violet-50 dark:bg-background space-y-2 pt-3 pb-1">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Check className="w-4 h-4 text-primary" />
          <span className="text-sm">Sem cobrança agora</span>
        </div>

        <Button
          onClick={onContinue}
          variant="gradient-pill"
          size="lg"
          className="w-full text-lg py-6"
        >
          Experimente por R$0,00
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Depois R$298,80 por ano (R$24,90/mês)
        </p>
      </section>
    </div>
  );
};