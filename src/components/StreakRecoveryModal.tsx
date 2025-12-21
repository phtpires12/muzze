import { useState } from 'react';
import { Flame, Snowflake, AlertTriangle, X, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StreakRecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lostDaysCount: number;
  availableFreezes: number;
  currentStreak: number;
  canUseFreeze: boolean;
  userXP: number;
  freezeCost: number;
  maxFreezes: number;
  wasRecentlyReset?: boolean;
  onUseFreeze: () => Promise<boolean>;
  onBuyFreezesAndRecover: () => Promise<boolean>;
  onResetStreak: () => Promise<boolean>;
  onDismiss: () => void;
  onProtectionSuccess?: (freezesUsed: number, currentStreak: number) => void;
}

export const StreakRecoveryModal = ({
  open,
  onOpenChange,
  lostDaysCount,
  availableFreezes,
  currentStreak,
  canUseFreeze,
  userXP,
  freezeCost,
  maxFreezes,
  wasRecentlyReset = false,
  onUseFreeze,
  onBuyFreezesAndRecover,
  onResetStreak,
  onDismiss,
  onProtectionSuccess,
}: StreakRecoveryModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Calcular quantos bloqueios precisam ser comprados
  const freezesToBuy = Math.max(0, lostDaysCount - availableFreezes);
  const totalCost = freezesToBuy * freezeCost;
  const canAfford = userXP >= totalCost;
  const wouldExceedLimit = availableFreezes + freezesToBuy > maxFreezes;
  const canBuyAndRecover = !canUseFreeze && freezesToBuy > 0 && canAfford && !wouldExceedLimit;

  const handleUseFreeze = async () => {
    setIsLoading(true);
    const success = await onUseFreeze();
    setIsLoading(false);

    if (success) {
      onOpenChange(false);
      onProtectionSuccess?.(lostDaysCount, currentStreak);
    } else {
      toast.error('Erro ao usar bloqueio', {
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const handleBuyFreezesAndRecover = async () => {
    setIsLoading(true);
    const success = await onBuyFreezesAndRecover();
    setIsLoading(false);

    if (success) {
      // Toast de sucesso imediato para feedback
      toast.success('Ofensiva protegida! 🛡️', {
        description: `Você comprou ${freezesToBuy} bloqueio(s) e salvou sua sequência de ${currentStreak} dias!`,
      });
      
      onOpenChange(false);
      // Total freezes used = freezesToBuy (purchased) + availableFreezes (existing)
      onProtectionSuccess?.(lostDaysCount, currentStreak);
    } else {
      toast.error('Erro ao comprar bloqueios', {
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const handleResetStreak = async () => {
    setIsLoading(true);
    const success = await onResetStreak();
    setIsLoading(false);

    if (success) {
      toast.info('Ofensiva reiniciada', {
        description: 'Não desista! Comece uma nova sequência hoje.',
      });
      onOpenChange(false);
    } else {
      toast.error('Erro ao reiniciar ofensiva', {
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl">
            {wasRecentlyReset ? 'Sua ofensiva foi perdida!' : 'Sua ofensiva está em risco!'}
          </DialogTitle>
          <DialogDescription className="text-base">
            Você ficou <strong className="text-foreground">{lostDaysCount} dia{lostDaysCount > 1 ? 's' : ''}</strong> sem criar.
            {currentStreak > 0 && (
              wasRecentlyReset 
                ? <> Sua ofensiva de <strong className="text-orange-500">{currentStreak} dias</strong> foi zerada.</>
                : <> Sua ofensiva de <strong className="text-orange-500">{currentStreak} dias</strong> pode ser perdida.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Option 1: Use Freezes (when has enough) */}
          {canUseFreeze && (
            <Button
              onClick={handleUseFreeze}
              disabled={isLoading}
              className="w-full h-auto py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold">Usar {lostDaysCount} bloqueio{lostDaysCount > 1 ? 's' : ''}</div>
                  <div className="text-xs text-white/80">
                    Você tem {availableFreezes} disponíveis
                  </div>
                </div>
              </div>
            </Button>
          )}

          {/* Not enough freezes warning + Buy option */}
          {!canUseFreeze && availableFreezes < lostDaysCount && (
            <>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Bloqueios insuficientes:</strong> Você tem {availableFreezes} bloqueio{availableFreezes !== 1 ? 's' : ''}, 
                mas precisa de {lostDaysCount} para cobrir os dias perdidos.
              </div>

              {/* Option to buy freezes and recover */}
              <Button
                onClick={handleBuyFreezesAndRecover}
                disabled={isLoading || !canBuyAndRecover}
                className="w-full h-auto py-4 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">
                      Comprar {freezesToBuy} bloqueio{freezesToBuy > 1 ? 's' : ''} e proteger
                    </div>
                    <div className="text-xs text-white/80">
                      Custo: {totalCost} XP (você tem {userXP} XP)
                    </div>
                  </div>
                </div>
              </Button>

              {/* Error messages */}
              {!canAfford && (
                <p className="text-xs text-destructive text-center">
                  ❌ XP insuficiente para comprar {freezesToBuy} bloqueio{freezesToBuy > 1 ? 's' : ''}
                </p>
              )}
              {wouldExceedLimit && canAfford && (
                <p className="text-xs text-destructive text-center">
                  ❌ Limite de {maxFreezes} bloqueios atingido
                </p>
              )}
            </>
          )}

          {/* Option 2: Reset Streak */}
          <Button
            onClick={handleResetStreak}
            disabled={isLoading}
            variant="outline"
            className="w-full h-auto py-4 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Aceitar o reset</div>
                <div className="text-xs text-muted-foreground">
                  Reiniciar ofensiva do zero
                </div>
              </div>
            </div>
          </Button>

          {/* Info about freezes */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              💡 Limite: máximo {maxFreezes} bloqueios de ofensiva
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
