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
import { RotateCcw, Shield } from "lucide-react";
import type { Subscription } from "@/hooks/useSubscription";

interface RefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
}

export function RefundRequestModal({ 
  open, 
  onOpenChange, 
  subscription 
}: RefundRequestModalProps) {
  
  const handleConfirmRefund = () => {
    const planName = subscription.plan_type === 'studio' ? 'Muzze Studio' : 'Muzze Pro';
    const subject = encodeURIComponent(`Solicitar reembolso - ${planName} (Garantia 7 dias)`);
    const body = encodeURIComponent(
      `Olá,\n\nGostaria de solicitar o reembolso da minha assinatura do ${planName}, conforme a garantia de 7 dias.\n\nID da assinatura: ${subscription.zouti_subscription_id || subscription.id}\n\nAgradeço a atenção!`
    );
    
    window.location.href = `mailto:suporte@muzze.app?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle>Solicitar reembolso</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Você está dentro do período de garantia de 7 dias e tem direito ao reembolso total.
            </p>
            <p>
              Ao confirmar, enviaremos sua solicitação para nossa equipe processar o reembolso. O valor será devolvido na mesma forma de pagamento utilizada.
            </p>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <strong>Importante:</strong> Após o reembolso, você perderá acesso imediato ao plano pago e será migrado para o plano Free.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-lg">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmRefund}
            className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Confirmar reembolso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
