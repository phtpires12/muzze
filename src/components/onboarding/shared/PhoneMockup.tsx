import iphoneMockupFrame from "@/assets/iphone-mockup-frame.png";

interface PhoneMockupProps {
  screenImage?: string;
  screenVideo?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PhoneMockup = ({ 
  screenImage, 
  screenVideo, 
  children, 
  className = "" 
}: PhoneMockupProps) => {
  const defaultSize = 'w-[260px] sm:w-[300px]';
  const hasCustomSize = className.includes('w-') || className.includes('h-') || className.includes('max-');
  
  return (
    <div className={`relative mx-auto ${hasCustomSize ? className : `${defaultSize} ${className}`}`}>
      
      {/* CAMADA 1: Container da tela com fundo preto (elimina vazamento branco) */}
      <div 
        className="absolute overflow-hidden bg-black"
        style={{
          // Inset calibrado para o frame iPhone 14/15 Pro
          top: '4.8%',
          bottom: '4.8%',
          left: '6.2%',
          right: '6.2%',
          // Border-radius para acompanhar os cantos internos do iPhone
          borderRadius: '10%',
        }}
      >
        {/* Mídia com scale de segurança para eliminar vazamentos nas bordas */}
        {children ? (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'scale(1.04)', transformOrigin: 'center' }}
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
            style={{ transform: 'scale(1.04)', transformOrigin: 'center' }}
          />
        ) : screenImage ? (
          <img 
            src={screenImage} 
            alt="App preview" 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.04)', transformOrigin: 'center' }}
            draggable={false}
          />
        ) : null}
      </div>
      
      {/* CAMADA 2: Frame do iPhone (ACIMA da tela) */}
      <img 
        src={iphoneMockupFrame} 
        alt="iPhone frame" 
        className="relative z-10 w-full h-auto object-contain pointer-events-none select-none"
        draggable={false}
      />
      
    </div>
  );
};
