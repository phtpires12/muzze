import iphoneMockupFrame from "@/assets/iphone-mockup-frame.png";

interface PhoneMockupProps {
  /** Custom frame image (defaults to iPhone 14/15 Pro frame) */
  frameSrc?: string;
  /** Static image to display on screen */
  screenImage?: string;
  /** Video to display on screen with autoplay/loop/muted */
  screenVideo?: string;
  /** Custom content to render inside the screen */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Screen corner radius in pixels (default: 38) */
  screenRadius?: number;
  /** Screen background color (default: #fff) */
  screenBg?: string;
}

/**
 * PhoneMockup - Robust iPhone mockup component with triple-defense against edge leaks
 * 
 * Architecture:
 * 1. Wrapper with isolation + dark bg + inset shadow fallback
 * 2. Dark underlay layer to absorb anti-aliasing from PNG
 * 3. Screen container with overflow-hidden + proper radius
 * 4. Media with safety scale to prevent edge gaps
 * 5. Frame overlay with micro-scale + GPU acceleration
 */
export const PhoneMockup = ({ 
  frameSrc = iphoneMockupFrame,
  screenImage, 
  screenVideo, 
  children, 
  className = "",
  screenRadius = 38,
  screenBg = "#fff",
}: PhoneMockupProps) => {
  const defaultSize = 'w-[260px] sm:w-[300px]';
  const hasCustomSize = className.includes('w-') || className.includes('h-') || className.includes('max-');
  
  // Screen inset values calibrated for iPhone 14/15 Pro frame
  const screenInset = {
    top: '4.8%',
    bottom: '4.8%',
    left: '6.2%',
    right: '6.2%',
  };

  // Dark background color for underlay (absorbs anti-aliasing from PNG)
  const darkBgColor = '#121212';
  
  return (
    <div 
      className={`relative mx-auto ${hasCustomSize ? className : `${defaultSize} ${className}`}`}
      style={{
        // Isolation prevents unexpected blending with parent layers
        isolation: 'isolate',
      }}
    >
      {/* LAYER 0: Dark underlay - slightly larger than screen to absorb PNG anti-aliasing */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: `calc(${screenInset.top} - 2px)`,
          bottom: `calc(${screenInset.bottom} - 2px)`,
          left: `calc(${screenInset.left} - 2px)`,
          right: `calc(${screenInset.right} - 2px)`,
          borderRadius: screenRadius + 4,
          backgroundColor: darkBgColor,
          zIndex: 1,
        }}
      />
      
      {/* LAYER 1: Screen container with white bg + overflow hidden */}
      <div 
        className="absolute overflow-hidden"
        style={{
          top: screenInset.top,
          bottom: screenInset.bottom,
          left: screenInset.left,
          right: screenInset.right,
          borderRadius: screenRadius,
          backgroundColor: screenBg,
          zIndex: 2,
        }}
      >
        {/* Media with safety scale (1.06) to eliminate edge gaps from subpixel rounding */}
        {children ? (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ 
              transform: 'scale(1.06) translateZ(0)', 
              transformOrigin: 'center',
            }}
          >
            {children}
          </div>
        ) : screenVideo ? (
          <video
            src={screenVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              transform: 'scale(1.06) translateZ(0)', 
              transformOrigin: 'center',
            }}
          />
        ) : screenImage ? (
          <img 
            src={screenImage} 
            alt="App preview" 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              transform: 'scale(1.06) translateZ(0)', 
              transformOrigin: 'center',
            }}
            draggable={false}
          />
        ) : (
          // Empty screen fallback - shows screen bg
          <div className="absolute inset-0 w-full h-full" />
        )}
      </div>
      
      {/* LAYER 2: Frame overlay with micro-scale + GPU acceleration */}
      <img 
        src={frameSrc} 
        alt="iPhone frame" 
        className="relative w-full h-auto object-contain pointer-events-none select-none"
        style={{
          zIndex: 10,
          // Micro-scale covers any edge anti-aliasing from the PNG
          transform: 'scale(1.012) translateZ(0)',
          willChange: 'transform',
          transformOrigin: 'center',
        }}
        draggable={false}
      />
    </div>
  );
};

/**
 * Helper component for displaying images in PhoneMockup
 * Ensures correct styling without manual configuration
 */
export const PhoneMockupImage = ({ 
  src, 
  alt = "Screen content" 
}: { 
  src: string; 
  alt?: string; 
}) => (
  <img 
    src={src} 
    alt={alt} 
    className="w-full h-full object-cover"
    draggable={false}
  />
);

/**
 * Helper component for displaying videos in PhoneMockup
 * Includes autoplay, loop, muted by default
 */
export const PhoneMockupVideo = ({ 
  src,
  autoPlay = true,
  loop = true,
  muted = true,
}: { 
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}) => (
  <video
    src={src}
    autoPlay={autoPlay}
    loop={loop}
    muted={muted}
    playsInline
    className="w-full h-full object-cover"
  />
);

export default PhoneMockup;
