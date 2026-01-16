import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Calendar, XCircle, RotateCcw, Shield, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";
import { RefundRequestModal } from "./RefundRequestModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function SubscriptionCard() {
  const { subscription, loading, isWithinRefundWindow, daysRemainingInRefundWindow } = useSubscription();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  if (loading) {
    return (
      <Card className="border border-border rounded-xl bg-background">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Don't show card if no subscription
  if (!subscription) {
    return null;
  }

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge variant="success">Ativa</Badge>;
      case 'cancelled':
        return <Badge variant="warning">Cancelamento agendado</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Reembolsada</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirada</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const getPlanDisplayName = () => {
    return subscription.plan_type === 'studio' ? 'Muzze Studio' : 'Muzze Pro';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleReactivate = () => {
    // Opens Zouti checkout for reactivation
    window.open('https://pay.zouti.com.br/muzze', '_blank');
  };

  return (
    <>
      <Card className="border border-border rounded-xl bg-background">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <CreditCard className="w-5 h-5 text-primary" />
              Detalhes da Assinatura
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Subscription Details */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plano</span>
              <span className="font-medium">{getPlanDisplayName()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Início</span>
              <span className="font-medium">{formatDate(subscription.started_at)}</span>
            </div>
            
            {subscription.status === 'active' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Próxima cobrança</span>
                <span className="font-medium">
                  {subscription.started_at 
                    ? formatDate(new Date(new Date(subscription.started_at).setMonth(new Date(subscription.started_at).getMonth() + 1)).toISOString())
                    : '-'
                  }
                </span>
              </div>
            )}
            
            {subscription.status === 'cancelled' && subscription.expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acesso até</span>
                <span className="font-medium text-amber-600">{formatDate(subscription.expires_at)}</span>
              </div>
            )}
            
            {subscription.status === 'refunded' && subscription.refunded_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reembolsado em</span>
                <span className="font-medium text-destructive">{formatDate(subscription.refunded_at)}</span>
              </div>
            )}
          </div>

          {/* Refund Window Notice */}
          {subscription.status === 'active' && isWithinRefundWindow() && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary">Garantia de 7 dias ativa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Você ainda tem {daysRemainingInRefundWindow()} dia{daysRemainingInRefundWindow() !== 1 ? 's' : ''} para solicitar reembolso total.
                </p>
              </div>
            </div>
          )}

          {/* Status-specific messages */}
          {subscription.status === 'cancelled' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-600">Cancelamento agendado</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seu acesso continua até {formatDate(subscription.expires_at)}. Após essa data, você será migrado para o plano Free.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {subscription.status === 'active' && (
              <>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-lg border-border hover:bg-muted"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar plano
                  </Button>
                  
                  {isWithinRefundWindow() && (
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => setRefundModalOpen(true)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Solicitar reembolso
                    </Button>
                  )}
                </div>
              </>
            )}

            {subscription.status === 'cancelled' && (
              <Button
                className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90"
                onClick={handleReactivate}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reativar assinatura
              </Button>
            )}

            {(subscription.status === 'refunded' || subscription.status === 'expired') && (
              <Button
                className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90"
                onClick={handleReactivate}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Assinar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CancelSubscriptionModal 
        open={cancelModalOpen} 
        onOpenChange={setCancelModalOpen}
        subscription={subscription}
      />
      
      <RefundRequestModal 
        open={refundModalOpen} 
        onOpenChange={setRefundModalOpen}
        subscription={subscription}
      />
    </>
  );
}
