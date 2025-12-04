import { Flame, Clock, Trophy, Star, TrendingUp } from "lucide-react";

export const PhoneMockup = () => {
  return (
    <div className="relative mx-auto w-[240px] sm:w-[280px]">
      {/* Phone Frame */}
      <div className="relative bg-black rounded-[40px] p-2 shadow-2xl">
        {/* Inner bezel */}
        <div className="relative bg-background rounded-[32px] overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />
          
          {/* Screen Content */}
          <div className="pt-10 pb-4 px-3 min-h-[420px] sm:min-h-[480px] bg-gradient-to-b from-background to-background/95">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                  <Flame className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary">12</span>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full">
                <Clock className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-medium text-accent">25min</span>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-4 mb-3 border border-primary/10">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Continuar criando
              </h3>
              <p className="text-[10px] text-muted-foreground mb-3">
                Você está a 13 minutos de manter sua ofensiva!
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Hoje</p>
                    <p className="text-xs font-bold text-foreground">12 min</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-primary rounded-full">
                  <span className="text-[10px] font-semibold text-primary-foreground">
                    Criar
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-card/50 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span className="text-[9px] text-muted-foreground">Nível</span>
                </div>
                <p className="text-lg font-bold text-foreground">7</p>
                <div className="w-full h-1 bg-muted rounded-full mt-1">
                  <div className="w-3/4 h-full bg-gradient-to-r from-primary to-accent rounded-full" />
                </div>
              </div>
              <div className="bg-card/50 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-3 h-3 text-accent" />
                  <span className="text-[9px] text-muted-foreground">XP Total</span>
                </div>
                <p className="text-lg font-bold text-foreground">2.450</p>
                <p className="text-[9px] text-muted-foreground">+150 hoje</p>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-card/50 rounded-xl p-3 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-[9px] text-muted-foreground">Esta semana</span>
                </div>
                <span className="text-[9px] font-medium text-primary">5/7 dias</span>
              </div>
              <div className="flex gap-1">
                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full aspect-square rounded-md flex items-center justify-center ${
                        i < 5 ? 'bg-gradient-to-br from-primary to-accent' : 'bg-muted'
                      }`}
                    >
                      {i < 5 && <Flame className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[8px] text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-foreground/20 rounded-full" />
        </div>
      </div>

      {/* Reflection/glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-[50px] blur-2xl -z-10 opacity-50" />
    </div>
  );
};
