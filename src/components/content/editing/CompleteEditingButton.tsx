import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Loader2 } from "lucide-react";

interface CompleteEditingButtonProps {
  onComplete: () => Promise<void>;
  isLoading?: boolean;
}

export function CompleteEditingButton({ onComplete, isLoading }: CompleteEditingButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleConfirm = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
      setShowConfirm(false);
    }
  };

  const loading = isLoading || isCompleting;

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        size="lg"
        className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Concluindo...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Marcar como Editado
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Edição?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao marcar como editado, seu conteúdo ficará pronto para publicação.
              Você ainda poderá voltar e fazer ajustes se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Concluindo...
                </>
              ) : (
                'Sim, Concluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
