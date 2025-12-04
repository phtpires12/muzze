import { useDeviceType } from "@/hooks/useDeviceType";
import phoneMockup from "@/assets/phone-mockup.png";
import macbookMockupVideo from "@/assets/muzze-macbook-mockup.mp4";

// Desktop mockup - simple video without frame
const DesktopMockup = () => {
  return (
    <div className="mx-auto max-w-[1080px] w-full">
      <video
        src={macbookMockupVideo}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto rounded-3xl shadow-2xl"
      />
    </div>
  );
};

// Responsive mockup component
export const PhoneMockup = () => {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === "desktop";

  if (isDesktop) {
    return <DesktopMockup />;
  }

  return (
    <div className="relative mx-auto w-[240px] sm:w-[280px]">
      <img 
        src={phoneMockup} 
        alt="Muzze app preview" 
        className="w-full h-auto"
      />
    </div>
  );
};
