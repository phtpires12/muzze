import iphoneMockupFrame from "@/assets/iphone-mockup-frame.png";

interface PhoneMockupProps {
  screenImage?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PhoneMockup = ({ screenImage, children, className = "" }: PhoneMockupProps) => {
  // Dimensão padrão se nenhuma for passada via className
  const defaultSize = 'w-[260px] sm:w-[300px]';
  const hasCustomSize = className.includes('w-') || className.includes('h-') || className.includes('max-');
  
  return (
    // Container principal - define o tamanho do componente
    <div className={`relative mx-auto ${hasCustomSize ? className : `${defaultSize} ${className}`}`}>
      
      {/* Frame do iPhone - elemento estrutural base que define o tamanho */}
      <img 
        src={iphoneMockupFrame} 
        alt="iPhone frame" 
        className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />
      
      {/* Container da tela - posicionado precisamente sobre a área de tela do frame */}
      <div 
        className="absolute z-0 overflow-hidden"
        style={{
          // Posicionamento pixel-perfect calibrado para o frame iPhone 14/15 Pro
          // Valores ajustados para encaixe exato na área de tela do PNG
          top: '1.8%',
          bottom: '1.8%',
          left: '4.2%',
          right: '4.2%',
          // Border-radius proporcional à largura do container (~44px em escala original)
          borderRadius: '10.5% / 5%',
        }}
      >
        {/* Conteúdo interno (imagem, vídeo ou children) */}
        {children ? (
          <div className="absolute inset-0 w-full h-full">
            {children}
          </div>
        ) : (
          screenImage && (
            <img 
              src={screenImage} 
              alt="App preview" 
              className="absolute inset-0 w-full h-full object-cover object-top"
              draggable={false}
            />
          )
        )}
      </div>
      
    </div>
  );
};
