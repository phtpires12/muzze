interface ConfettiProps {
  count?: number;
}

export const Confetti = ({ count = 50 }: ConfettiProps) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8B94', '#A8E6CF'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 md:w-3 md:h-3 animate-confetti-fall"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
};
