import { Card } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface Screen9LostPostsProps {
  monthsTrying: number;
  currentPosts: number;
  lostPosts: number;
}

export const Screen9LostPosts = ({
  monthsTrying,
  currentPosts,
  lostPosts,
}: Screen9LostPostsProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <TrendingDown className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-3xl font-bold">Você perdeu {lostPosts} oportunidades</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Em {monthsTrying} {monthsTrying === 1 ? "mês" : "meses"} tentando ser consistente,
          você publicou {currentPosts} {currentPosts === 1 ? "vez" : "vezes"}.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-destructive">
              {lostPosts}
            </div>
            <p className="text-xl font-semibold">
              Posts que você poderia ter feito
            </p>
            <p className="text-muted-foreground">
              Se você tivesse postado a cada 2 dias (um ritmo sustentável),
              você teria {Math.floor((monthsTrying * 30) / 2)} posts agora.
            </p>
          </div>

          <div className="pt-6 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Posts esperados:</span>
              <span className="font-semibold">{Math.floor((monthsTrying * 30) / 2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Posts realizados:</span>
              <span className="font-semibold">{currentPosts}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-destructive font-semibold">Oportunidades perdidas:</span>
              <span className="text-destructive font-bold text-xl">{lostPosts}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
