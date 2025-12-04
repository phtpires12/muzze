import phoneMockup from "@/assets/phone-mockup.png";

export const PhoneMockup = () => {
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
