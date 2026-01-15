import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
  /** Variant controls positioning: full covers entire area, top/bottom fade out */
  variant?: "full" | "top" | "bottom" | "hero";
  /** Intensity controls opacity of aurora layers */
  intensity?: "subtle" | "medium" | "strong";
  /** Enable/disable animations */
  animated?: boolean;
  /** Use dark base background (default: true for aurora effect) */
  darkBase?: boolean;
}

/**
 * AuroraBackground - Creates an ethereal aurora borealis effect
 * 
 * Structure:
 * - Layer 0: Dark base background (#050510)
 * - Layer 1: Deep blue glow (base aurora)
 * - Layer 2: Cyan highlights (screen blend)
 * - Layer 3: Purple glow (screen blend)
 * - Layer 4: Pink accent (soft-light blend, subtle)
 * - Layer 5: Noise/grain texture overlay
 * 
 * All layers use elliptical gradients with heavy blur and rotation
 * for organic, flowing light streaks.
 */
export const AuroraBackground = ({
  children,
  className,
  variant = "full",
  intensity = "medium",
  animated = true,
  darkBase = true,
}: AuroraBackgroundProps) => {
  // Intensity controls overall opacity of aurora layers
  const intensityMultiplier = {
    subtle: 0.5,
    medium: 0.75,
    strong: 1,
  };

  const multiplier = intensityMultiplier[intensity];

  // Variant controls masking/positioning
  const variantStyles = {
    full: "inset-0",
    hero: "inset-0",
    top: "inset-x-0 top-0 h-[70vh]",
    bottom: "inset-x-0 bottom-0 h-[70vh]",
  };

  const maskStyles = {
    full: "",
    hero: "",
    top: "[mask-image:linear-gradient(to_bottom,black_40%,transparent)]",
    bottom: "[mask-image:linear-gradient(to_top,black_40%,transparent)]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        darkBase && "bg-[#050510]", // Almost black with blue tint
        className
      )}
    >
      {/* Aurora layers container */}
      <div
        className={cn(
          "absolute pointer-events-none",
          variantStyles[variant],
          maskStyles[variant]
        )}
        aria-hidden="true"
      >
        {/* 
          Layer 1: Deep Blue Base Glow
          - Largest layer, creates the foundational blue atmosphere
          - Positioned top-left, rotated diagonally
          - Heavy blur for soft edges
        */}
        <div
          className={cn(
            "absolute w-[150vw] h-[80vh]",
            "-left-[25%] -top-[10%]",
            "rotate-[-15deg]",
            "rounded-full",
            "blur-[120px]",
            animated && "animate-aurora-wave"
          )}
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(220 90% 25% / ${0.6 * multiplier}) 0%, 
              hsl(220 90% 20% / ${0.3 * multiplier}) 40%, 
              transparent 70%)`,
          }}
        />

        {/* 
          Layer 2: Cyan Highlight Streak
          - Creates the bright cyan/teal highlights
          - Screen blend mode for additive light effect
          - Slightly different rotation for depth
        */}
        <div
          className={cn(
            "absolute w-[120vw] h-[50vh]",
            "left-[5%] top-[15%]",
            "rotate-[-8deg]",
            "rounded-full",
            "blur-[100px]",
            "mix-blend-screen",
            animated && "animate-aurora-wave-delayed"
          )}
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(190 85% 45% / ${0.5 * multiplier}) 0%, 
              hsl(190 85% 40% / ${0.2 * multiplier}) 35%, 
              transparent 60%)`,
          }}
        />

        {/* 
          Layer 3: Purple Glow
          - Adds color variety with purple tones
          - Positioned right side for balance
          - Breathe animation for subtle pulsing
        */}
        <div
          className={cn(
            "absolute w-[100vw] h-[70vh]",
            "right-[-15%] top-[20%]",
            "rotate-[12deg]",
            "rounded-full",
            "blur-[140px]",
            "mix-blend-screen",
            animated && "animate-aurora-breathe"
          )}
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(270 70% 40% / ${0.45 * multiplier}) 0%, 
              hsl(270 70% 35% / ${0.2 * multiplier}) 40%, 
              transparent 65%)`,
          }}
        />

        {/* 
          Layer 4: Pink Accent (subtle)
          - Very subtle pink/magenta accent
          - Soft-light blend for gentle color mixing
          - Only visible at higher intensities
        */}
        <div
          className={cn(
            "absolute w-[80vw] h-[40vh]",
            "left-[25%] top-[35%]",
            "rotate-[-5deg]",
            "rounded-full",
            "blur-[80px]",
            "mix-blend-soft-light",
            animated && "animate-aurora-pulse"
          )}
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(320 60% 50% / ${0.3 * multiplier}) 0%, 
              transparent 50%)`,
          }}
        />

        {/* 
          Layer 5: Secondary Cyan Streak (lower)
          - Adds depth with another cyan layer
          - Positioned lower for vertical coverage
        */}
        <div
          className={cn(
            "absolute w-[130vw] h-[45vh]",
            "-left-[15%] bottom-[5%]",
            "rotate-[-20deg]",
            "rounded-full",
            "blur-[110px]",
            "mix-blend-screen",
            animated && "animate-aurora-drift"
          )}
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(200 80% 35% / ${0.35 * multiplier}) 0%, 
              hsl(210 80% 30% / ${0.15 * multiplier}) 40%, 
              transparent 60%)`,
          }}
        />

        {/* 
          Layer 6: Noise/Grain Texture Overlay
          - Adds subtle film grain for depth and texture
          - Very low opacity to not overpower
          - Overlay blend mode
        */}
        <div className="absolute inset-0 aurora-noise-dark" />
      </div>

      {/* Content rendered above aurora */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};
