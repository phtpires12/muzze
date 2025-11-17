import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "./IdeaCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Idea {
  id: string;
  title?: string | null;
  content_type?: string | null;
  central_idea?: string | null;
  reference_url?: string | null;
  status?: string | null;
  publish_date?: string | null;
}

interface IdeaCarouselProps {
  ideas: Idea[];
  onUpdateIdea: (id: string, data: any) => void;
  onDeleteIdea: (id: string) => void;
  onCreateIdea: () => void;
  onScheduleIdea: (id: string) => void;
}

export const IdeaCarousel = ({ 
  ideas, 
  onUpdateIdea, 
  onDeleteIdea, 
  onCreateIdea,
  onScheduleIdea 
}: IdeaCarouselProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Workspace de Brainstorming</h2>
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {ideas.length}/3 ideias
          </div>
        </div>
        {ideas.length < 3 && (
          <Button size="sm" onClick={onCreateIdea} className="h-8">
            <Plus className="w-4 h-4 mr-1" />
            Nova Ideia
          </Button>
        )}
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Crie até 3 ideias e organize-as antes de agendá-las
          </p>
          <Button onClick={onCreateIdea}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Ideia
          </Button>
        </div>
      ) : (
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {ideas.map((idea) => (
              <CarouselItem key={idea.id} className="pl-2 basis-[90%]">
                <div className="h-full">
                  <IdeaCard
                    id={idea.id}
                    title={idea.title || ""}
                    contentType={idea.content_type || ""}
                    centralIdea={idea.central_idea || ""}
                    referenceUrl={idea.reference_url || ""}
                    onUpdate={onUpdateIdea}
                    onDelete={onDeleteIdea}
                    onSchedule={() => onScheduleIdea(idea.id)}
                    compact
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {ideas.length > 1 && (
            <>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </>
          )}
        </Carousel>
      )}
    </div>
  );
};
