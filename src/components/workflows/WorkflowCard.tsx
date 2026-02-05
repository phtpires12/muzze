import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowTemplate } from "@/lib/workflow-templates";
import { getStageLabel } from "@/lib/workflow-templates";
import { cn } from "@/lib/utils";

interface WorkflowCardProps {
  template: WorkflowTemplate;
  isActive: boolean;
  onSelect: (templateId: string) => void;
}

export function WorkflowCard({ template, isActive, onSelect }: WorkflowCardProps) {
  return (
    <Card
      className={cn(
        "relative p-6 transition-all duration-300 cursor-pointer",
        "hover:shadow-lg hover:border-primary/50",
        isActive 
          ? "border-2 border-primary bg-primary/5" 
          : "border-border"
      )}
      onClick={() => onSelect(template.id)}
    >
      {/* Active Badge */}
      {isActive && (
        <Badge 
          className="absolute top-4 right-4 bg-primary text-primary-foreground gap-1"
        >
          <Check className="w-3 h-3" />
          Ativo
        </Badge>
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
          template.gradient
        )}
      >
        <span className="text-3xl">{template.icon}</span>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-foreground mb-1">
        {template.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {template.description}
      </p>

      {/* Stages Flow */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {template.stages.map((stage, index) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
              {getStageLabel(stage)}
            </span>
            {index < template.stages.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Activate Button */}
      {!isActive && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template.id);
          }}
        >
          Ativar este workflow
        </Button>
      )}
    </Card>
  );
}
