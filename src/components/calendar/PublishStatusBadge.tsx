import { Calendar, Sparkles, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PublishStatus = "planejado" | "pronto_para_postar" | "postado" | "perdido";

interface PublishStatusBadgeProps {
  status: PublishStatus | null | undefined;
  className?: string;
  compact?: boolean;
}

const statusConfig: Record<PublishStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  planejado: {
    label: "Agendado",
    icon: Calendar,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  pronto_para_postar: {
    label: "Pronto",
    icon: Sparkles,
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  postado: {
    label: "Postado",
    icon: Check,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  perdido: {
    label: "Data perdida",
    icon: AlertTriangle,
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
};

export function PublishStatusBadge({ status, className, compact = false }: PublishStatusBadgeProps) {
  const effectiveStatus = status || "planejado";
  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium border",
        config.className,
        className
      )}
    >
      <Icon className={cn("w-3 h-3", !compact && "mr-1")} />
      {!compact && config.label}
    </Badge>
  );
}
