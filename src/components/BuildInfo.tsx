import { BUILD_INFO, getShortBuildId } from '@/lib/build-info';

interface BuildInfoProps {
  className?: string;
  showMode?: boolean;
}

export function BuildInfo({ className = '', showMode = false }: BuildInfoProps) {
  return (
    <div className={`text-xs text-muted-foreground font-mono ${className}`}>
      Build: {getShortBuildId()}
      {showMode && ` (${BUILD_INFO.mode})`}
    </div>
  );
}
