import { Crown, Calendar, Sparkles, Building2, Users, Check } from "lucide-react";
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
import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";

export type PaywallAction = 'create_script' | 'schedule_future' | 'invite_user' | 'create_workspace' | 'invite_guest_limit';

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
  create_workspace: {
    icon: Building2,
    title: "Limite de workspaces atingido",
    description: (props) => `Você atingiu o limite de ${props.limit || 1} workspace${(props.limit || 1) > 1 ? 's' : ''} do seu plano. Faça upgrade para criar mais workspaces.`,
    benefit: "Até 5 workspaces (Studio) + add-ons",
  },
  invite_guest_limit: {
    icon: Users,
    title: "Limite de convidados atingido",
    description: (props) => `Você já tem ${props.currentUsage || 0} de ${props.limit || 0} convidados permitidos no seu plano.`,
    benefit: "Mais convidados por workspace",
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
      {/* Aurora header with icon */}
      <AuroraBackground 
        variant="full" 
        intensity="subtle" 
        animated={false}
        className="rounded-xl py-6 -mx-2"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </AuroraBackground>

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
                  : "border-border"
              )}
            />
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">+</span>
          </div>
        </div>
      )}

      {/* Benefits list */}
      <div className="space-y-3 py-4 border-t border-border">
        <p className="text-sm font-semibold text-center">Com o Pro você ganha:</p>
        <ul className="space-y-2.5">
          {PRO_BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary" strokeWidth={2} />
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
              variant="gradient-pill"
              size="lg"
              className="w-full"
            >
              <Crown className="w-4 h-4 mr-2" strokeWidth={1.5} />
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
            variant="gradient-pill"
            size="lg"
            className="w-full"
          >
            <Crown className="w-4 h-4 mr-2" strokeWidth={1.5} />
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
