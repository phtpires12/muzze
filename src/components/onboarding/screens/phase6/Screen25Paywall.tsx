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
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-violet-50 dark:bg-background px-6"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* AREA 1 - Header + Title (z-20, above everything) */}
      <div className="relative z-20 pt-4">
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
        <div className="text-center mt-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Experimente a Muzze<br />gratuitamente.
          </h1>
        </div>
      </div>

      {/* AREA 2 - Mockup (z-10, responsive size, pb reserves footer space) */}
      <section className="relative z-10 flex justify-center mt-2 pb-28">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={MOCKUP_IMAGES[currentIndex]}
            alt="App preview"
            className="pointer-events-none select-none h-auto w-auto object-contain"
            style={{
              maxHeight: '56dvh',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            draggable={false}
          />
        </AnimatePresence>
      </section>

      {/* AREA 3 - Footer CTA (absolute bottom, z-30, with safe area) */}
      <section
        className="absolute left-0 right-0 bottom-0 z-30 bg-violet-50 dark:bg-background px-6 pt-3 space-y-2"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* Masked pill for "Sem cobrança agora" */}
        <div className="flex justify-center">
          <div className="relative z-40 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-violet-50 dark:bg-background">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Sem cobrança agora</span>
          </div>
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