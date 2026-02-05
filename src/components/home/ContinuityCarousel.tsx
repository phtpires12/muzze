import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContinuitySlide } from "./ContinuitySlide";
import { useContinuityOptions, ContinuityOption } from "@/hooks/useContinuityOptions";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

const AUTOPLAY_INTERVAL = 4000; // 4 segundos

interface ContinuityCarouselProps {
  username?: string;
  onStartNewSession: () => void;
}

export function ContinuityCarousel({ username, onStartNewSession }: ContinuityCarouselProps) {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { options, loading } = useContinuityOptions();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset index when options change
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [options.length]);

  // Autoplay logic
  useEffect(() => {
    if (options.length <= 1 || isPaused) {
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = (50 / AUTOPLAY_INTERVAL) * 100;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    const transitionTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % options.length);
      setProgress(0);
    }, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(transitionTimeout);
    };
  }, [options.length, isPaused, currentIndex]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const handleContinue = useCallback(() => {
    if (options.length === 0) return;
    
    const currentOption = options[currentIndex];
    trackEvent("continued_activity", { type: currentOption.type });
    
    // Navegar com base no stage
    const stage = currentOption.stage;
    if (stage === "editing") {
      navigate(`/editing-workspace?scriptId=${currentOption.scriptId}`);
    } else if (stage === "review") {
      navigate(`/session?stage=review&scriptId=${currentOption.scriptId}`);
    } else if (stage === "recording") {
      navigate(`/shot-list/record?scriptId=${currentOption.scriptId}`);
    } else if (stage === "draft") {
      navigate(`/session?stage=script&scriptId=${currentOption.scriptId}`);
    } else {
      navigate(`/session?stage=idea&scriptId=${currentOption.scriptId}`);
    }
  }, [options, currentIndex, navigate, trackEvent]);

  // Loading state
  if (loading) {
    return (
      <Card className="p-8 bg-card border border-border shadow-sm rounded-xl animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-secondary/50 rounded w-4/5"></div>
          <div className="p-4 bg-secondary/30 rounded-2xl space-y-2">
            <div className="h-5 bg-secondary/50 rounded w-3/4"></div>
            <div className="h-4 bg-secondary/40 rounded w-1/2"></div>
            <div className="h-3 bg-secondary/30 rounded w-2/3"></div>
          </div>
          <div className="h-12 bg-secondary/50 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  // No options - show welcome screen
  if (options.length === 0) {
    return (
      <Card className="p-8 bg-card border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl animate-fade-in">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo de volta{username ? `, ${username.split(" ")[0]}` : ""}
          </h2>

          <Button
            id="tutorial-start-session"
            data-testid="cta-start-session"
            onClick={onStartNewSession}
            className="w-full relative overflow-hidden group h-14 rounded-2xl font-semibold text-base shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--accent)/0.2)]"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              boxShadow: "0 0 0 1px hsl(var(--accent)), inset 0 1px 0 hsl(var(--primary)/0.5)",
            }}
          >
            <Zap className="w-5 h-5 mr-2" />
            Iniciar sessão criativa
          </Button>
          <p className="text-xs text-muted-foreground">
            Defina a etapa e comece a criar — o tempo trabalhado vale pontos e streak.
          </p>
        </div>
      </Card>
    );
  }

  const currentOption = options[currentIndex];

  return (
    <Card
      className={cn(
        "p-8 bg-card border border-border",
        "shadow-sm hover:shadow-md transition-shadow",
        "rounded-xl animate-fade-in"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="space-y-4">
        {/* Header with progress bar */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            {username ? `${username.split(" ")[0]}, retome` : "Retome"} sua criação
          </h2>

          {/* Progress bar and dots - only show if more than 1 option */}
          {options.length > 1 && (
            <div className="flex items-center gap-3">
              {/* Progress segments */}
              <div className="flex-1 flex gap-1">
                {options.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 rounded-full bg-secondary/50 overflow-hidden cursor-pointer"
                    onClick={() => handleDotClick(index)}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-100",
                        index < currentIndex
                          ? "bg-primary w-full"
                          : index === currentIndex
                          ? "bg-primary"
                          : "bg-transparent"
                      )}
                      style={{
                        width: index === currentIndex ? `${progress}%` : index < currentIndex ? "100%" : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Counter */}
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {currentIndex + 1}/{options.length}
              </span>
            </div>
          )}
        </div>

        {/* Slide content with animation */}
        <div className="relative min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentOption.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <ContinuitySlide option={currentOption} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <Button
          id="tutorial-start-session"
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg h-12 rounded-xl font-semibold"
        >
          Continuar criando →
        </Button>

        <button
          onClick={onStartNewSession}
          className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors py-2"
        >
          ou iniciar nova sessão
        </button>
      </div>
    </Card>
  );
}
