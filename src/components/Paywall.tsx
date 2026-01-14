import { useState } from "react";
import { Crown, Calendar, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

export type PaywallAction = 'create_script' | 'schedule_future' | 'invite_user';

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  action: PaywallAction;
  currentUsage?: number;
  limit?: number;
  daysUntilReset?: number;
  context?: string;
}

const PAYWALL_CONTENT: Record<PaywallAction, {
  icon: typeof Crown;
  title: string;
  description: (props: PaywallProps) => string;
  benefit: string;
}> = {
  create_script: {
    icon: Sparkles,
    title: "Limite semanal atingido",
    description: (props) => {
      const days = props.daysUntilReset || 1;
      return `Você já criou os ${props.limit || 3} conteúdos disponíveis no plano Free esta semana. A semana reseta em ${days} dia${days > 1 ? 's' : ''}.`;
    },
    benefit: "Conteúdos ilimitados por semana",
  },
  schedule_future: {
    icon: Calendar,
    title: "Planejamento futuro é Pro",
    description: () => "No plano Free, você só consegue planejar dentro da semana atual. Faça upgrade para planejar semanas futuras.",
    benefit: "Agende para qualquer data futura",
  },
  invite_user: {
    icon: Crown,
    title: "Colaboração é Pro",
    description: () => "No plano Free, você não pode convidar colaboradores. Faça upgrade para trabalhar em equipe.",
    benefit: "Convide até 3 colaboradores",
  },
};

const PRO_BENEFITS = [
  "Conteúdos ilimitados por semana",
  "Planeje qualquer data futura",
  "Convide colaboradores",
  "Todos os recursos premium",
];

export const Paywall = ({
  open,
  onClose,
  action,
  currentUsage,
  limit,
  daysUntilReset,
  context,
}: PaywallProps) => {
  const deviceType = useDeviceType();
  const { trackEvent } = useAnalytics();
  const isMobile = deviceType === "mobile";
  
  const content = PAYWALL_CONTENT[action];
  const Icon = content.icon;

  const handleUpgradeClick = () => {
    trackEvent('paywall_cta_clicked', {
      action,
      plan: 'free',
      usage: currentUsage,
      limit,
      context,
    });
    
    // TODO: Implementar navegação para página de upgrade/Stripe
    console.log('[Paywall] Upgrade clicked - implement Stripe integration');
    onClose();
  };

  const handleClose = () => {
    trackEvent('paywall_dismissed', {
      action,
      plan: 'free',
      context,
    });
    onClose();
  };

  const ContentBody = () => (
    <div className="space-y-6">
      {/* Icon and Title */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Usage indicator (for create_script) */}
      {action === 'create_script' && limit && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-colors",
                i < (currentUsage || 0)
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30"
              )}
            />
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">+</span>
          </div>
        </div>
      )}

      {/* Benefits list */}
      <div className="space-y-2 py-4 border-t border-border">
        <p className="text-sm font-medium text-center mb-3">Com o Pro você ganha:</p>
        <ul className="space-y-2">
          {PRO_BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>{content.title}</DrawerTitle>
            <DrawerDescription>
              {content.description({ open, onClose, action, currentUsage, limit, daysUntilReset })}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4">
            <ContentBody />
          </div>
          
          <DrawerFooter className="gap-2">
            <Button 
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver planos Pro
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" onClick={handleClose}>
                Continuar no Free
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>
            {content.description({ open, onClose, action, currentUsage, limit, daysUntilReset })}
          </DialogDescription>
        </DialogHeader>
        
        <ContentBody />
        
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            <Crown className="w-4 h-4 mr-2" />
            Ver planos Pro
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full">
            Continuar no Free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
