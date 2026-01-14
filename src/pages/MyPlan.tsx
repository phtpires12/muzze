import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, Check, Sparkles, Building2, Users, Calendar, Infinity, Lock, Plus, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanCapabilities } from "@/contexts/PlanContext";
import { cn } from "@/lib/utils";

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
      case 'studio': return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
      case 'pro': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
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
      <div className="border-b border-border bg-card">
        <div 
          className="container mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Assinatura</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl space-y-6">
        {/* Admin Mode Toggle - Only for internal testers */}
        {planCapabilities.isInternalTester && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-600 text-base">
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="real" id="real" />
                  <Label htmlFor="real" className="text-sm cursor-pointer">
                    Real (Studio)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="text-sm cursor-pointer">
                    Free
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pro" id="pro" />
                  <Label htmlFor="pro" className="text-sm cursor-pointer">
                    Pro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="studio" id="studio" />
                  <Label htmlFor="studio" className="text-sm cursor-pointer">
                    Studio
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}
        {/* Current Plan Card */}
        <Card className="overflow-hidden">
          <div className={cn("p-6", getPlanBadgeColor())}>
            <div className="flex items-center gap-3">
              {getPlanIcon()}
              <div>
                <h2 className="text-xl font-bold">{getPlanDisplayName()}</h2>
                <p className="text-sm opacity-90">Seu plano atual</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Benefits List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                O que inclui
              </h3>
              <ul className="space-y-2">
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
                      "text-sm",
                      !benefit.available && "text-muted-foreground line-through"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uso Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workspaces */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-500" />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
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
        <Card>
          <CardContent className="p-6">
            {planCapabilities.planType === 'free' && (
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={handleUpgrade}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Assinar Pro
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleUpgrade}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Assinar Studio
                </Button>
              </div>
            )}

            {planCapabilities.planType === 'pro' && (
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                onClick={handleUpgrade}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Ir para Studio
              </Button>
            )}

            {planCapabilities.planType === 'studio' && (
              <Button 
                variant="outline"
                className="w-full"
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
          <Card className="border-violet-500/30 bg-violet-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-violet-500" />
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
