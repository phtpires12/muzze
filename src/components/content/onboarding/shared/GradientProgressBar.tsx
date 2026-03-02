interface GradientProgressBarProps {
  progress: number; // 0-100
}

export const GradientProgressBar = ({ progress }: GradientProgressBarProps) => {
  return (
    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};
