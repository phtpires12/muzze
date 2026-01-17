import iphoneMockupFrame from "@/assets/iphone-mockup-frame.png";

interface PhoneMockupProps {
  screenImage?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PhoneMockup = ({ screenImage, children, className = "" }: PhoneMockupProps) => {
  return (
    <div className={`relative mx-auto ${className || 'w-[260px] sm:w-[300px]'}`}>
      {/* Screenshot layer - behind the frame */}
      {(screenImage || children) && (
        <div className="absolute inset-[2.5%] top-[1.5%] bottom-[1.5%] overflow-hidden rounded-[2.5rem]">
          {children || (
            screenImage && (
              <img 
                src={screenImage} 
                alt="App preview" 
                className="w-full h-full object-cover object-top"
              />
            )
          )}
        </div>
      )}
      {/* iPhone frame - on top */}
      <img 
        src={iphoneMockupFrame} 
        alt="Phone frame" 
        className="relative z-10 w-full h-auto pointer-events-none"
      />
    </div>
  );
};
