import { useDeviceType } from "@/hooks/useDeviceType";
import phoneMockup from "@/assets/phone-mockup.png";
import { Flame, Clock, Trophy, TrendingUp, Sparkles } from "lucide-react";

// MacBook mockup for desktop
const MacBookMockup = () => {
  return (
    <div className="relative mx-auto w-[520px]">
      {/* MacBook Frame */}
      <div className="bg-zinc-800 rounded-t-2xl p-3 border-4 border-zinc-700 shadow-2xl">
        {/* Camera notch */}
        <div className="flex justify-center mb-2">
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
        </div>
        
        {/* Screen */}
        <div className="bg-background rounded-lg overflow-hidden aspect-[16/10]">
          {/* Mini Home Preview */}
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-foreground">0 dias</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">0 sessões</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-muted" />
            </div>

            {/* Main Card */}
            <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-xl p-4 mb-4 border border-primary/20">
              <h3 className="text-sm font-semibold text-foreground mb-1">Bem-vindo de volta!</h3>
              <p className="text-xs text-muted-foreground mb-3">Pronto para criar hoje?</p>
              <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg inline-block">
                Iniciar sessão criativa
              </div>
            </div>

            {/* Progress Cards Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-card rounded-lg p-2.5 border border-border">
                <Trophy className="w-4 h-4 text-yellow-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Conquistas</p>
                <p className="text-xs font-semibold text-foreground">0/12</p>
              </div>
              <div className="bg-card rounded-lg p-2.5 border border-border">
                <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Tempo Total</p>
                <p className="text-xs font-semibold text-foreground">0h 0m</p>
              </div>
              <div className="bg-card rounded-lg p-2.5 border border-border">
                <Sparkles className="w-4 h-4 text-purple-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Novidades</p>
                <p className="text-xs font-semibold text-foreground">Ver</p>
              </div>
            </div>

            {/* Motivational Card */}
            <div className="bg-muted/30 rounded-lg p-3 mt-auto">
              <p className="text-[10px] text-muted-foreground text-center italic">
                "Consistência é mais poderosa que perfeição."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* MacBook Base/Hinge */}
      <div className="bg-zinc-700 h-4 rounded-b-xl flex items-center justify-center">
        <div className="w-24 h-1.5 bg-zinc-600 rounded-full" />
      </div>
      
      {/* Shadow under MacBook */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-3 bg-black/20 blur-md rounded-full" />
    </div>
  );
};

// Responsive mockup component
export const PhoneMockup = () => {
  const deviceType = useDeviceType();
  const isDesktop = deviceType === "desktop";

  if (isDesktop) {
    return <MacBookMockup />;
  }

  return (
    <div className="relative mx-auto w-[240px] sm:w-[280px]">
      <img 
        src={phoneMockup} 
        alt="Muzze app preview" 
        className="w-full h-auto"
      />
    </div>
  );
};
