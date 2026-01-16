import { ReactNode } from "react";
import iphoneFrame from "@/assets/iphone-frame.png";
import { cn } from "@/lib/utils";

interface DeviceMockupProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const DeviceMockup = ({ 
  children, 
  className,
  size = "md" 
}: DeviceMockupProps) => {
  const sizeClasses = {
    sm: "w-[200px]",
    md: "w-[280px]",
    lg: "w-[360px]"
  };

  return (
    <div className={cn("relative mx-auto", sizeClasses[size], className)}>
      {/* Content area - positioned under the frame */}
      <div 
        className="absolute overflow-hidden bg-black"
        style={{
          top: "2.8%",
          left: "3.8%",
          right: "3.8%",
          bottom: "2.8%",
          borderRadius: "8.5% / 4.5%",
        }}
      >
        {children}
      </div>
      
      {/* iPhone frame PNG - always on top */}
      <img 
        src={iphoneFrame} 
        alt="" 
        className="relative z-10 w-full h-auto pointer-events-none select-none"
        draggable={false}
      />
    </div>
  );
};
