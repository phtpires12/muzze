import { useState, useEffect } from "react";
import { Shield, Pencil, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreativeStage, CREATIVE_STAGES, StagePermissions } from "@/types/workspace";

interface MemberForPermissions {
  id: string;
  name?: string;
  email: string;
  allowedTimerStages: CreativeStage[];
  canEditStages: CreativeStage[];
}

interface MemberPermissionsModalProps {
  member: MemberForPermissions | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: StagePermissions) => Promise<void>;
}

const STAGES_ORDER: CreativeStage[] = ['ideation', 'script', 'review', 'recording', 'editing'];

export const MemberPermissionsModal = ({
  member,
  isOpen,
  onClose,
  onSave,
}: MemberPermissionsModalProps) => {
  const [canEditStages, setCanEditStages] = useState<CreativeStage[]>([]);
  const [allowedTimerStages, setAllowedTimerStages] = useState<CreativeStage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado quando o membro muda
  useEffect(() => {
    if (member) {
      setCanEditStages(member.canEditStages || []);
      setAllowedTimerStages(member.allowedTimerStages || []);
    }
  }, [member]);

  const toggleEditStage = (stage: CreativeStage) => {
    setCanEditStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const toggleTimerStage = (stage: CreativeStage) => {
    setAllowedTimerStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        can_edit_stages: canEditStages,
        allowed_timer_stages: allowedTimerStages,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissões
          </DialogTitle>
          <DialogDescription>
            Configure o que <strong>{member.name || member.email}</strong> pode acessar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seção: Etapas que pode editar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Etapas que pode EDITAR
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STAGES_ORDER.map((stage) => {
                const stageInfo = CREATIVE_STAGES[stage];
                const isChecked = canEditStages.includes(stage);
                return (
                  <div
                    key={`edit-${stage}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-primary/10 border-primary/50"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleEditStage(stage)}
                  >
                    <Checkbox
                      id={`edit-${stage}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleEditStage(stage)}
                    />
                    <Label
                      htmlFor={`edit-${stage}`}
                      className="cursor-pointer text-sm font-medium flex-1"
                    >
                      {stageInfo.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção: Etapas que pode usar o timer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Etapas que pode usar o TIMER
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STAGES_ORDER.map((stage) => {
                const stageInfo = CREATIVE_STAGES[stage];
                const isChecked = allowedTimerStages.includes(stage);
                return (
                  <div
                    key={`timer-${stage}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-primary/10 border-primary/50"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleTimerStage(stage)}
                  >
                    <Checkbox
                      id={`timer-${stage}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleTimerStage(stage)}
                    />
                    <Label
                      htmlFor={`timer-${stage}`}
                      className="cursor-pointer text-sm font-medium flex-1"
                    >
                      {stageInfo.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nota informativa */}
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            💡 O colaborador só verá conteúdos nas etapas de edição selecionadas acima.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
