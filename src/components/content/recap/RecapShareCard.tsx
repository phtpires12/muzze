import { forwardRef } from "react";
import { PERIOD_LABELS, PERIOD_DAYS } from "@/types/recap";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";

interface RecapShareCardProps {
  totalMinutes: number;
  daysActive: number;
  sessionsCount: number;
  periodType: string;
  favoriteStage?: string | null;
  weeklyGoalHitCount?: number;
  totalWeeks?: number;
}

const STAGE_LABELS: Record<string, string> = {
  ideation: "Ideação",
  script: "Roteiro",
  recording: "Gravação",
  editing: "Edição",
  publishing: "Publicação",
};

export const RecapShareCard = forwardRef<HTMLDivElement, RecapShareCardProps>(({
  totalMinutes,
  daysActive,
  sessionsCount,
  periodType,
  favoriteStage,
  weeklyGoalHitCount = 0,
  totalWeeks = 4,
}, ref) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const periodLabel = PERIOD_LABELS[periodType] || periodType;
  const periodDays = PERIOD_DAYS[periodType] || 30;
  const avgMinutesPerDay = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0;

  return (
    <div
      ref={ref}
      className="w-[360px] h-[640px] p-6 flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(165deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background decorations */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />
      <div 
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 z-10">
        <img 
          src={muzzeLeafWhite} 
          alt="Muzze" 
          className="w-8 h-8"
          crossOrigin="anonymous"
        />
        <span className="text-white/80 text-sm font-medium">Meu Recap {periodLabel}</span>
      </div>

      {/* Main stat */}
      <div className="flex-1 flex flex-col justify-center z-10">
        <p className="text-white/60 text-sm mb-2">Nos últimos {periodDays} dias, criei por</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-6xl font-bold text-white">{hours}</span>
          <span className="text-2xl text-white/80">h</span>
          {mins > 0 && (
            <>
              <span className="text-4xl font-bold text-white">{mins}</span>
              <span className="text-xl text-white/80">min</span>
            </>
          )}
        </div>
        <p className="text-white/50 text-sm">
          ~{avgMinutesPerDay} minutos por dia ativo
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 z-10">
        <div 
          className="p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-3xl font-bold text-white mb-1">{daysActive}</p>
          <p className="text-white/60 text-xs">dias ativos</p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-3xl font-bold text-white mb-1">{sessionsCount}</p>
          <p className="text-white/60 text-xs">sessões</p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-3xl font-bold text-white mb-1">{weeklyGoalHitCount}/{totalWeeks}</p>
          <p className="text-white/60 text-xs">metas semanais</p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-xl font-bold text-white mb-1 truncate">
            {favoriteStage ? STAGE_LABELS[favoriteStage] || favoriteStage : "—"}
          </p>
          <p className="text-white/60 text-xs">etapa favorita</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">Feito com</span>
          <span className="text-white font-semibold text-sm">Muzze</span>
        </div>
        <span className="text-white/30 text-xs">muzze.lovable.app</span>
      </div>
    </div>
  );
});

RecapShareCard.displayName = "RecapShareCard";
