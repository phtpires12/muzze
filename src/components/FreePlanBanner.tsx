import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntilWeekReset } from "@/lib/timezone-utils";
import { useProfileContext } from "@/contexts/ProfileContext";

export const FreePlanBanner = () => {
  const planCapabilities = usePlanCapabilitiesOptional();
  const { profile } = useProfileContext();
  const navigate = useNavigate();
  
  // Don't show if not free plan or still loading
  if (!planCapabilities || planCapabilities.loading) return null;
  if (planCapabilities.planType !== 'free') return null;
  
  const remaining = planCapabilities.remainingWeeklySlots();
  const total = planCapabilities.limits.weeklyScripts;
  const timezone = profile?.timezone || 'America/Sao_Paulo';
  const daysLeft = daysUntilWeekReset(timezone);
  
  const isLow = remaining <= 1;
  const isEmpty = remaining === 0;
  
  return (
    <div 
      className={cn(
        "rounded-xl p-4 flex items-center justify-between gap-3",
        "border transition-all duration-200",
        isEmpty 
          ? "border-destructive/40 bg-destructive/5" 
          : isLow 
            ? "border-amber-500/40 bg-amber-500/5" 
            : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isEmpty 
            ? "bg-destructive/10" 
            : isLow 
              ? "bg-amber-500/10" 
              : "bg-primary/10"
        )}>
          {isEmpty ? (
            <Clock className="w-5 h-5 text-destructive" strokeWidth={1.5} />
          ) : (
            <Sparkles className={cn(
              "w-5 h-5",
              isLow ? "text-amber-600 dark:text-amber-400" : "text-primary"
            )} strokeWidth={1.5} />
          )}
        </div>
        <div>
          <p className={cn(
            "font-semibold text-sm",
            isEmpty 
              ? "text-destructive" 
              : isLow 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-foreground"
          )}>
            {isEmpty 
              ? "Limite semanal atingido" 
              : `${remaining}/${total} conteúdos restantes`
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isEmpty 
              ? `Libera em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}` 
              : `Reseta em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>
      
      <button
        onClick={() => navigate('/settings')}
        className="text-xs font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Upgrade
      </button>
    </div>
  );
};
