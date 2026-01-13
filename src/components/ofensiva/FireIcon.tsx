interface FireIconProps {
  minutes: number;
  goalMinutes: number;
  size?: 'sm' | 'md' | 'lg';
  isToday?: boolean;
}

const FireIcon = ({ minutes, goalMinutes, size = 'sm', isToday }: FireIconProps) => {
  const percentage = Math.min((minutes / goalMinutes) * 100, 100);
  
  // Mapear tamanhos
  const sizes = {
    sm: 'text-lg',   // ~18px
    md: 'text-2xl',  // ~24px
    lg: 'text-4xl',  // ~36px
  };
  
  // Estado: Fogo apagado (0 min)
  if (percentage === 0) {
    return (
      <span className={`${sizes[size]} opacity-20 grayscale select-none`}>
        🔥
      </span>
    );
  }
  
  // Estado: Fogo completo (≥100%)
  if (percentage >= 100) {
    return (
      <span 
        className={`${sizes[size]} select-none ${isToday ? 'drop-shadow-[0_0_6px_rgba(251,146,60,0.7)]' : 'drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]'}`}
      >
        🔥
      </span>
    );
  }
  
  // Estado: Fogo parcial - preenchimento de baixo para cima
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Base apagada */}
      <span className={`${sizes[size]} opacity-20 grayscale select-none`}>
        🔥
      </span>
      {/* Overlay preenchido proporcionalmente de baixo para cima */}
      <span 
        className={`${sizes[size]} absolute inset-0 flex items-center justify-center select-none`}
        style={{ 
          clipPath: `inset(${100 - percentage}% 0 0 0)` 
        }}
      >
        🔥
      </span>
    </div>
  );
};

export default FireIcon;
