import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
  variant?: "full" | "top" | "bottom";
  intensity?: "subtle" | "medium" | "strong";
  animated?: boolean;
}

export const AuroraBackground = ({
  children,
  className,
  variant = "full",
  intensity = "medium",
  animated = true,
}: AuroraBackgroundProps) => {
  const intensityMap = {
    subtle: "opacity-30",
    medium: "opacity-50",
    strong: "opacity-70",
  };

  const variantStyles = {
    full: "inset-0",
    top: "inset-x-0 top-0 h-[50vh]",
    bottom: "inset-x-0 bottom-0 h-[50vh]",
  };

  const maskStyles = {
    full: "",
    top: "[mask-image:linear-gradient(to_bottom,black_30%,transparent)]",
    bottom: "[mask-image:linear-gradient(to_top,black_30%,transparent)]",
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Aurora gradient layers */}
      <div
        className={cn(
          "absolute pointer-events-none",
          variantStyles[variant],
          maskStyles[variant],
          intensityMap[intensity]
        )}
        aria-hidden="true"
      >
        {/* Primary purple/magenta blob */}
        <div
          className={cn(
            "absolute w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full blur-[100px] md:blur-[120px]",
            "bg-[radial-gradient(circle,hsl(var(--aurora-pink))_0%,transparent_70%)]",
            "-top-[20%] -left-[20%]",
            animated && "animate-aurora-shift"
          )}
        />

        {/* Secondary purple blob */}
        <div
          className={cn(
            "absolute w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full blur-[80px] md:blur-[100px]",
            "bg-[radial-gradient(circle,hsl(var(--aurora-purple))_0%,transparent_70%)]",
            "top-[10%] right-[-10%]",
            animated && "animate-aurora-shift-reverse"
          )}
        />

        {/* Tertiary blue blob */}
        <div
          className={cn(
            "absolute w-[60vw] h-[60vw] md:w-[45vw] md:h-[45vw] rounded-full blur-[60px] md:blur-[80px]",
            "bg-[radial-gradient(circle,hsl(var(--aurora-blue))_0%,transparent_70%)]",
            "bottom-[10%] left-[20%]",
            animated && "animate-aurora-shift-delayed"
          )}
        />

        {/* Subtle white/light accent */}
        <div
          className={cn(
            "absolute w-[40vw] h-[40vw] md:w-[30vw] md:h-[30vw] rounded-full blur-[60px]",
            "bg-[radial-gradient(circle,hsl(0_0%_100%/0.4)_0%,transparent_70%)]",
            "top-[30%] left-[40%]",
            animated && "animate-aurora-pulse"
          )}
        />

        {/* Grain texture overlay */}
        <div className="absolute inset-0 aurora-noise" />
      </div>

      {/* Content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};
