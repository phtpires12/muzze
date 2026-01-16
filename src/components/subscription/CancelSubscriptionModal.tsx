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
import { AlertTriangle } from "lucide-react";
import type { Subscription } from "@/hooks/useSubscription";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
}

export function CancelSubscriptionModal({ 
  open, 
  onOpenChange, 
  subscription 
}: CancelSubscriptionModalProps) {
  
  const handleConfirmCancel = () => {
    const planName = subscription.plan_type === 'studio' ? 'Muzze Studio' : 'Muzze Pro';
    const subject = encodeURIComponent(`Cancelar assinatura - ${planName}`);
    const body = encodeURIComponent(
      `Olá,\n\nGostaria de solicitar o cancelamento da minha assinatura do ${planName}.\n\nID da assinatura: ${subscription.zouti_subscription_id || subscription.id}\n\nPor favor, mantenham meu acesso até o final do período atual.\n\nObrigado!`
    );
    
    window.location.href = `mailto:suporte@muzze.app?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Ao cancelar, você ainda terá acesso ao plano atual até o final do período pago.
            </p>
            <p>
              Após essa data, sua conta será migrada automaticamente para o plano Free com funcionalidades limitadas.
            </p>
            <p className="text-muted-foreground text-xs">
              Você pode reativar sua assinatura a qualquer momento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-lg">
            Manter assinatura
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmCancel}
            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
          >
            Confirmar cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
