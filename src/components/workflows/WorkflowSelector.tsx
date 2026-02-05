import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  WORKFLOW_TEMPLATES_LIST, 
  WorkflowTemplateId,
  getWorkflowTemplate,
} from "@/lib/workflow-templates";
import { useWorkflowTemplate } from "@/hooks/useWorkflowTemplate";

interface WorkflowSelectorProps {
  /** Valor atual do workflow (null = herda do global) */
  value: WorkflowTemplateId | null;
  /** Callback quando o workflow muda */
  onChange: (value: WorkflowTemplateId | null) => void;
  /** Se true, mostra opção "Herdar do sistema" */
  showInheritOption?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function WorkflowSelector({ 
  value, 
  onChange, 
  showInheritOption = true,
  className 
}: WorkflowSelectorProps) {
  const { currentTemplateId } = useWorkflowTemplate();
  
  // Se value é null e showInheritOption, mostrar workflow global como hint
  const displayValue = value || (showInheritOption ? 'inherit' : currentTemplateId);
  const currentGlobalTemplate = getWorkflowTemplate(currentTemplateId);
  
  const handleChange = (newValue: string) => {
    if (newValue === 'inherit') {
      onChange(null);
    } else {
      onChange(newValue as WorkflowTemplateId);
    }
  };
  
  return (
    <Select value={displayValue} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecione o workflow" />
      </SelectTrigger>
      <SelectContent>
        {showInheritOption && (
          <SelectItem value="inherit">
            <div className="flex items-center gap-2">
              <span className="opacity-60">🔗</span>
              <div className="flex flex-col">
                <span>Herdar do sistema</span>
                <span className="text-xs text-muted-foreground">
                  Usando: {currentGlobalTemplate.icon} {currentGlobalTemplate.name}
                </span>
              </div>
            </div>
          </SelectItem>
        )}
        {WORKFLOW_TEMPLATES_LIST.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <span>{template.icon}</span>
              <div className="flex flex-col">
                <span>{template.name}</span>
                <span className="text-xs text-muted-foreground">
                  {template.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
