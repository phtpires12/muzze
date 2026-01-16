import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTutorial } from "./TutorialProvider";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialOverlay() {
  const { 
    isActive, 
    currentStep, 
    currentStepData, 
    totalSteps, 
    nextStep, 
    prevStep, 
    skipTutorial 
  } = useTutorial();
  
  const isMobile = useIsMobile();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and track target element position
  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        // Element not found, retry after a short delay
        setTimeout(findTarget, 100);
      }
    };

    findTarget();

    // Update on scroll/resize
    const handleUpdate = () => findTarget();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isActive, currentStepData, currentStep]);

  // Calculate tooltip position based on target and preferred position
  useEffect(() => {
    if (!targetRect || !currentStepData || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;
    const arrowSize = 8;

    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding - arrowSize;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.top + targetRect.height + padding + arrowSize;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - padding - arrowSize;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left + targetRect.width + padding + arrowSize;
        break;
    }

    // Keep tooltip within viewport
    const viewportPadding = 16;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));

    setTooltipPosition({ top, left });
  }, [targetRect, currentStepData]);

  // Don't render on mobile or when tutorial is not active
  if (isMobile || !isActive || !currentStepData) return null;

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with hole for target */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Highlight ring around target with glow effect */}
      {targetRect && (
        <>
          {/* Outer glow ring */}
          <div
            className="absolute pointer-events-none rounded-xl animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            }}
          />
          {/* Inner highlight ring */}
          <div
            className="absolute pointer-events-none rounded-xl border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </>
      )}

      {/* Click blocker (except for highlighted area) */}
      <div 
        className="absolute inset-0" 
        onClick={(e) => e.stopPropagation()}
        style={{
          clipPath: targetRect 
            ? `polygon(
                0 0, 
                100% 0, 
                100% 100%, 
                0 100%, 
                0 0, 
                ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                ${targetRect.left - 8}px ${targetRect.top + targetRect.height + 8}px, 
                ${targetRect.left + targetRect.width + 8}px ${targetRect.top + targetRect.height + 8}px, 
                ${targetRect.left + targetRect.width + 8}px ${targetRect.top - 8}px, 
                ${targetRect.left - 8}px ${targetRect.top - 8}px
              )`
            : undefined
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm z-10",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button
          onClick={skipTutorial}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Pular tutorial"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="font-semibold text-foreground text-base mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center gap-1.5 mt-4 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTutorial}
            className="text-muted-foreground hover:text-foreground"
          >
            Pular
          </Button>
          
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={nextStep}
              className="min-w-[100px]"
            >
              {isLastStep ? 'Começar!' : 'Próximo'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Arrow pointing to target */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-card border-border rotate-45",
            currentStepData.position === 'top' && "bottom-[-7px] left-1/2 -translate-x-1/2 border-r border-b",
            currentStepData.position === 'bottom' && "top-[-7px] left-1/2 -translate-x-1/2 border-l border-t",
            currentStepData.position === 'left' && "right-[-7px] top-1/2 -translate-y-1/2 border-r border-t",
            currentStepData.position === 'right' && "left-[-7px] top-1/2 -translate-y-1/2 border-l border-b"
          )}
        />
      </div>
    </div>,
    document.body
  );
}
