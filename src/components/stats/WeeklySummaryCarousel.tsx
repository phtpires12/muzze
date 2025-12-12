import { useState, useEffect } from "react";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface WeeklySummaryCarouselProps {
  currentWeek: {
    totalMinutes: number;
    goalMinutes: number;
    productivity: number;
  };
  previousWeek: {
    totalMinutes: number;
    productivity: number;
  };
}

const formatTimeDisplay = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}min`;
  }
  return `${hours.toFixed(1)}h`;
};

const DifferenceIndicator = ({ 
  current, 
  previous,
  higherIsBetter = true 
}: { 
  current: number; 
  previous: number;
  higherIsBetter?: boolean;
}) => {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  
  let diff: number;
  if (previous === 0) {
    diff = current > 0 ? 100 : 0;
  } else {
    diff = Math.round(((current - previous) / Math.abs(previous)) * 100);
  }
  
  const isPositive = higherIsBetter ? diff >= 0 : diff <= 0;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
      isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
    )}>
      {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {diff >= 0 ? '+' : ''}{diff}%
    </div>
  );
};

export const WeeklySummaryCarousel = ({ 
  currentWeek, 
  previousWeek 
}: WeeklySummaryCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollNext = () => {
    api?.scrollNext();
  };

  const getMotivationalMessage = () => {
    if (currentWeek.productivity >= 0) {
      return "Você está arrasando! Continue assim! 💪";
    }
    return "Pequenos passos todos os dias fazem diferença! 🌱";
  };

  return (
    <div className="space-y-4">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {currentSlide === 0 ? "📊 Resumo da Semana" : "📊 Comparativo Semanal"}
        </h3>
        <div className="flex items-center gap-2">
          {/* Indicadores de página */}
          <div className="flex gap-1">
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors",
              currentSlide === 0 ? "bg-primary" : "bg-muted-foreground/30"
            )} />
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors",
              currentSlide === 1 ? "bg-primary" : "bg-muted-foreground/30"
            )} />
          </div>
          {/* Seta de navegação */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={scrollNext}
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              currentSlide === 1 && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Carrossel */}
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {/* Slide 1: Semana Atual */}
          <CarouselItem>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">⏱️ Total trabalhado</span>
                <span className="font-bold">
                  {formatTimeDisplay(currentWeek.totalMinutes / 60)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">🎯 Meta da semana</span>
                <span className="font-bold">{currentWeek.goalMinutes} min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">📈 Produtividade</span>
                <span className={cn(
                  "font-bold",
                  currentWeek.productivity >= 0 ? "text-green-600" : "text-orange-600"
                )}>
                  {currentWeek.productivity >= 0 ? '+' : ''}{currentWeek.productivity}%
                </span>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4">
                {getMotivationalMessage()}
              </p>
            </div>
          </CarouselItem>

          {/* Slide 2: Comparativo */}
          <CarouselItem>
            <div className="space-y-4">
              {/* Comparativo de Tempo Trabalhado */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">⏱️ Total trabalhado</span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Esta semana</span>
                    <p className="font-bold">{formatTimeDisplay(currentWeek.totalMinutes / 60)}</p>
                  </div>
                  <DifferenceIndicator 
                    current={currentWeek.totalMinutes} 
                    previous={previousWeek.totalMinutes} 
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">Semana anterior</span>
                    <p className="font-medium text-muted-foreground">
                      {formatTimeDisplay(previousWeek.totalMinutes / 60)}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Comparativo de Produtividade */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">📈 Produtividade</span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Esta semana</span>
                    <p className={cn(
                      "font-bold",
                      currentWeek.productivity >= 0 ? "text-green-600" : "text-orange-600"
                    )}>
                      {currentWeek.productivity >= 0 ? '+' : ''}{currentWeek.productivity}%
                    </p>
                  </div>
                  <DifferenceIndicator 
                    current={currentWeek.productivity} 
                    previous={previousWeek.productivity}
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">Semana anterior</span>
                    <p className={cn(
                      "font-medium",
                      previousWeek.productivity >= 0 ? "text-green-600/60" : "text-orange-600/60"
                    )}>
                      {previousWeek.productivity >= 0 ? '+' : ''}{previousWeek.productivity}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
};
