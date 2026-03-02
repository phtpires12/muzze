import { useState, useEffect } from "react";

interface SafeAreas {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = (): SafeAreas => {
  const [safeAreas, setSafeAreas] = useState<SafeAreas>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const computeSafeAreas = () => {
      // Create a temporary element to measure safe area values
      const el = document.createElement("div");
      el.style.position = "fixed";
      el.style.top = "env(safe-area-inset-top, 0px)";
      el.style.bottom = "env(safe-area-inset-bottom, 0px)";
      el.style.left = "env(safe-area-inset-left, 0px)";
      el.style.right = "env(safe-area-inset-right, 0px)";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      document.body.appendChild(el);

      const computed = getComputedStyle(el);
      
      setSafeAreas({
        top: parseInt(computed.top.replace("px", "") || "0", 10),
        bottom: parseInt(computed.bottom.replace("px", "") || "0", 10),
        left: parseInt(computed.left.replace("px", "") || "0", 10),
        right: parseInt(computed.right.replace("px", "") || "0", 10)
      });

      document.body.removeChild(el);
    };

    computeSafeAreas();
    
    // Recompute on resize and orientation change
    window.addEventListener("resize", computeSafeAreas);
    window.addEventListener("orientationchange", computeSafeAreas);
    
    return () => {
      window.removeEventListener("resize", computeSafeAreas);
      window.removeEventListener("orientationchange", computeSafeAreas);
    };
  }, []);

  return safeAreas;
};
