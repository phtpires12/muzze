import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, Check, Sparkles, Building2, Users, Calendar, Infinity, Lock, Plus, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanCapabilities } from "@/contexts/PlanContext";
import { cn } from "@/lib/utils";
import { PlanDebugCard } from "@/components/dev/PlanDebugCard";

const MyPlan = () => {
  const navigate = useNavigate();
  const planCapabilities = usePlanCapabilities();

  const getPlanDisplayName = (plan?: 'free' | 'pro' | 'studio') => {
    const targetPlan = plan || planCapabilities.planType;
    switch (targetPlan) {
      case 'studio': return 'Muzze Studio';
      case 'pro': return 'Muzze Pro';
      default: return 'Muzze Free';
    }
  };

  const getPlanBadgeColor = () => {
    switch (planCapabilities.planType) {
      case 'studio': return 'bg-primary text-primary-foreground';
      case 'pro': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPlanIcon = () => {
    switch (planCapabilities.planType) {
      case 'studio': return <Building2 className="w-5 h-5" />;
      case 'pro': return <Crown className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  // Benefits for each plan
  const freeBenefits = [
    { icon: Calendar, text: '3 conteúdos por semana', available: true },
    { icon: Calendar, text: 'Planejamento só na semana atual', available: true },
    { icon: Building2, text: '1 workspace', available: true },
    { icon: Users, text: 'Sem convidados', available: false },
  ];

  const proBenefits = [
    { icon: Infinity, text: 'Conteúdos ilimitados', available: true },
    { icon: Calendar, text: 'Planejamento em qualquer data', available: true },
    { icon: Building2, text: '1 workspace', available: true },
    { icon: Users, text: 'Até 3 convidados', available: true },
  ];

  const studioBenefits = [
    { icon: Infinity, text: 'Conteúdos ilimitados', available: true },
    { icon: Calendar, text: 'Planejamento em qualquer data', available: true },
    { icon: Building2, text: `${planCapabilities.totalWorkspacesLimit()} workspaces${planCapabilities.getExtraWorkspacesPacks() > 0 ? ` (${planCapabilities.limits.maxWorkspaces} base + ${planCapabilities.getExtraWorkspacesPacks() * 5} extras)` : ''}`, available: true },
    { icon: Users, text: 'Até 4 convidados por workspace', available: true },
  ];

  const getCurrentBenefits = () => {
    switch (planCapabilities.planType) {
      case 'studio': return studioBenefits;
      case 'pro': return proBenefits;
      default: return freeBenefits;
    }
  };

  // Usage stats
  const workspacesUsed = planCapabilities.usage.ownedWorkspacesCount;
  const workspacesLimit = planCapabilities.totalWorkspacesLimit();
  const guestsLimit = planCapabilities.limits.maxGuests;

  const handleUpgrade = () => {
    // Placeholder for Stripe integration
    console.log('Upgrade clicked - Stripe integration pending');
  };

  const handleManageAddons = () => {
    // Placeholder for add-on management
    console.log('Manage add-ons clicked');
  };

  const handleSimulatePlan = (value: string) => {
    if (value === 'real') {
      planCapabilities.setSimulatedPlan(null);
    } else {
      planCapabilities.setSimulatedPlan(value as 'free' | 'pro' | 'studio');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div 
          className="container mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/profile")}
              className="rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciar Assinatura</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl space-y-6">
        {/* Admin Mode Toggle - Only for internal testers */}
        {planCapabilities.isInternalTester && (
          <Card className="border border-amber-500/30 bg-amber-500/5 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-600 text-base font-semibold">
                <Wrench className="w-4 h-4" />
                Modo Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Simular visualização de outro plano para testar a UI:
              </p>
              <RadioGroup 
                defaultValue="real" 
                onValueChange={handleSimulatePlan}
                className="flex flex-wrap gap-3"
              >
                {[
                  { value: 'real', label: 'Real (Studio)' },
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'studio', label: 'Studio' },
                ].map((option) => (
                  <div 
                    key={option.value}
                    className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}
        {/* Current Plan Card */}
        <Card className="overflow-hidden border border-border rounded-xl bg-background">
          <div className={cn("p-6", getPlanBadgeColor())}>
            <div className="flex items-center gap-3">
              {getPlanIcon()}
              <div>
                <h2 className="text-xl font-bold tracking-tight">{getPlanDisplayName()}</h2>
                <p className="text-sm opacity-90">Seu plano atual</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Benefits List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                O que inclui
              </h3>
              <ul className="space-y-3">
                {getCurrentBenefits().map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      benefit.available 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {benefit.available ? (
                        <benefit.icon className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      !benefit.available && "text-muted-foreground line-through font-normal"
                    )}>
                      {benefit.text}
                    </span>
                    {benefit.available && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="border border-border rounded-xl bg-background">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Uso Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workspaces */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Workspaces</p>
                  <p className="text-xs text-muted-foreground">Criados por você</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {workspacesUsed} / {workspacesLimit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workspacesLimit - workspacesUsed} disponível{workspacesLimit - workspacesUsed !== 1 ? 'is' : ''}
                </p>
              </div>
            </div>

            {/* Guests per workspace */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Convidados por workspace</p>
                  <p className="text-xs text-muted-foreground">Limite do plano</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {guestsLimit === 0 ? 'Não disponível' : `Até ${guestsLimit}`}
                </p>
              </div>
            </div>

            {/* Weekly scripts (for free plan) */}
            {planCapabilities.planType === 'free' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Conteúdos esta semana</p>
                    <p className="text-xs text-muted-foreground">Reseta toda segunda</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {planCapabilities.usage.scriptsThisWeek} / {planCapabilities.limits.weeklyScripts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {planCapabilities.remainingWeeklySlots()} restante{planCapabilities.remainingWeeklySlots() !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTAs */}
        <Card className="border border-border rounded-xl bg-background">
          <CardContent className="p-6">
            {planCapabilities.planType === 'free' && (
              <div className="space-y-3">
                <Button 
                  className="w-full h-11 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium"
                  onClick={handleUpgrade}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Assinar Pro
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-11 rounded-lg border-border hover:bg-muted font-medium"
                  onClick={handleUpgrade}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Assinar Studio
                </Button>
              </div>
            )}

            {planCapabilities.planType === 'pro' && (
              <Button 
                className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 font-medium"
                onClick={handleUpgrade}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Ir para Studio
              </Button>
            )}

            {planCapabilities.planType === 'studio' && (
              <Button 
                variant="outline"
                className="w-full h-11 rounded-lg border-border hover:bg-muted font-medium"
                onClick={handleManageAddons}
              >
                <Plus className="w-4 h-4 mr-2" />
                Gerenciar Add-ons
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Studio Add-on Info */}
        {planCapabilities.planType === 'studio' && planCapabilities.getExtraWorkspacesPacks() > 0 && (
          <Card className="border border-primary/20 bg-primary/5 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Add-ons ativos</p>
                  <p className="text-xs text-muted-foreground">
                    {planCapabilities.getExtraWorkspacesPacks()} pacote{planCapabilities.getExtraWorkspacesPacks() > 1 ? 's' : ''} de +5 workspaces
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyPlan;
