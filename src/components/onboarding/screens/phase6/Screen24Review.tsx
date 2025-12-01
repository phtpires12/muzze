import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";

interface Screen24ReviewProps {
  onSkip: () => void;
}

export const Screen24Review = ({ onSkip }: Screen24ReviewProps) => {
  const handleReview = () => {
    // In production, this would open app store review
    window.open("https://lovable.dev", "_blank");
    onSkip();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">Gostando da experiência até aqui?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sua opinião nos ajuda a melhorar a Muzze para todos os criadores.
        </p>
      </div>

      <Card className="p-8 max-w-md mx-auto">
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-10 h-10 fill-accent text-accent"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Se você está empolgado com a Muzze, uma avaliação 5 estrelas 
            nos ajuda muito a crescer e alcançar mais criadores como você.
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-3 max-w-md mx-auto">
        <Button onClick={handleReview} size="lg" className="w-full">
          Avaliar a Muzze
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Talvez depois
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground max-w-md mx-auto">
        Você pode avaliar a qualquer momento nas configurações.
      </p>
    </div>
  );
};
