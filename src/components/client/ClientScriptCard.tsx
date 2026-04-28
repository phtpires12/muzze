import { useState } from "react";
import { Calendar, Check, ChevronDown, ChevronUp, Film, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientScript } from "@/core/hooks/useClientScripts";
import { CREATIVE_STAGES, CreativeStage } from "@/types/workspace";
import { cn } from "@/core/utils/utils";

interface ClientScriptCardProps {
  script: ClientScript;
  currentStage: CreativeStage;
  onApprove: (script: ClientScript) => void;
  onRequestChanges: (script: ClientScript) => void;
  isProcessing?: boolean;
}

export const ClientScriptCard = ({
  script,
  currentStage,
  onApprove,
  onRequestChanges,
  isProcessing,
}: ClientScriptCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const stageInfo = CREATIVE_STAGES[currentStage];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Thumbnail */}
      {script.thumbnail_url ? (
        <div className="relative aspect-video w-full bg-muted">
          <img
            src={script.thumbnail_url}
            alt={script.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Film className="h-12 w-12 text-primary/40" />
        </div>
      )}

      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{script.title}</h3>
            {script.central_idea && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {script.central_idea}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {stageInfo.label}
          </Badge>
          {script.content_type && (
            <Badge variant="secondary" className="text-xs capitalize">
              {script.content_type}
            </Badge>
          )}
          {script.publish_date && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(script.publish_date), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>

        {/* Conteúdo expansível */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Recolher detalhes
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Ver roteiro e shot list
            </>
          )}
        </button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border">
            {script.content && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Roteiro
                </p>
                <div
                  className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: script.content }}
                />
              </div>
            )}
            {script.shot_list && script.shot_list.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Shot list
                </p>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {script.shot_list.map((shot, i) => (
                    <li key={i}>{shot}</li>
                  ))}
                </ul>
              </div>
            )}
            {(script.reference_url || (script.reference_links && script.reference_links.length > 0)) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Referências
                </p>
                <div className="flex flex-col gap-1">
                  {script.reference_url && (
                    <a
                      href={script.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline truncate"
                    >
                      {script.reference_url}
                    </a>
                  )}
                  {script.reference_links?.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline truncate"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onRequestChanges(script)}
            disabled={isProcessing}
            className="w-full"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Pedir ajuste
          </Button>
          <Button
            onClick={() => onApprove(script)}
            disabled={isProcessing}
            className={cn("w-full")}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Marquei como feito
          </Button>
        </div>
      </div>
    </div>
  );
};