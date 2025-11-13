import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IdeaCard } from "./IdeaCard";
import { CompactCalendar } from "./CompactCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Idea {
  id: string;
  title?: string;
  content_type?: string;
  central_idea?: string;
  reference_url?: string;
  status: string;
  publish_date?: string;
}

export const BrainstormWorkspace = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scheduledIdeas, setScheduledIdeas] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadIdeas();
    loadScheduledIdeas();
  }, []);

  const loadIdeas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("scripts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "draft_idea")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error loading ideas:", error);
      return;
    }

    setIdeas(data || []);
  };

  const loadScheduledIdeas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("scripts")
      .select("publish_date")
      .eq("user_id", user.id)
      .eq("status", "scheduled_idea")
      .not("publish_date", "is", null);

    if (error) {
      console.error("Error loading scheduled ideas:", error);
      return;
    }

    const counts: Record<string, number> = {};
    data?.forEach((item) => {
      if (item.publish_date) {
        counts[item.publish_date] = (counts[item.publish_date] || 0) + 1;
      }
    });

    setScheduledIdeas(counts);
  };

  const createNewIdea = async () => {
    if (ideas.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Você pode trabalhar em até 3 ideias simultaneamente. Agende uma ideia para liberar espaço.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("scripts")
      .insert({
        user_id: user.id,
        title: "",
        status: "draft_idea",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating idea:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a ideia.",
        variant: "destructive",
      });
      return;
    }

    setIdeas([...ideas, data]);
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    const { error } = await supabase
      .from("scripts")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating idea:", error);
      return;
    }

    setIdeas(ideas.map(idea => idea.id === id ? { ...idea, ...updates } : idea));
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase
      .from("scripts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting idea:", error);
      return;
    }

    setIdeas(ideas.filter(idea => idea.id !== id));
    toast({
      title: "Ideia excluída",
      description: "A ideia foi removida com sucesso.",
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !over.id.toString().startsWith("calendar-day-")) {
      return;
    }

    const ideaId = active.id as string;
    const idea = ideas.find(i => i.id === ideaId);
    
    if (!idea || !idea.content_type || !idea.central_idea || idea.central_idea.length < 20) {
      toast({
        title: "Ideia incompleta",
        description: "Preencha todos os campos obrigatórios antes de agendar.",
        variant: "destructive",
      });
      return;
    }

    const targetDate = over.id.toString().replace("calendar-day-", "");

    const { error } = await supabase
      .from("scripts")
      .update({
        publish_date: targetDate,
        status: "scheduled_idea",
      })
      .eq("id", ideaId);

    if (error) {
      console.error("Error scheduling idea:", error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar a ideia.",
        variant: "destructive",
      });
      return;
    }

    setIdeas(ideas.filter(i => i.id !== ideaId));
    setScheduledIdeas({
      ...scheduledIdeas,
      [targetDate]: (scheduledIdeas[targetDate] || 0) + 1,
    });

    toast({
      title: "Ideia agendada!",
      description: `Ideia agendada para ${format(new Date(targetDate), "dd/MM/yyyy")}`,
    });
  };

  const activeIdea = ideas.find(i => i.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6 h-full">
        <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">Workspace de Brainstorming</h2>
            <p className="text-sm text-muted-foreground">
              Crie até 3 ideias simultaneamente e arraste para o calendário quando estiverem prontas
            </p>
          </div>

          <SortableContext items={ideas.map(i => i.id)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[0, 1, 2].map((index) => {
                const idea = ideas[index];
                return idea ? (
                  <div key={idea.id} className="h-[400px]">
                    <IdeaCard
                      id={idea.id}
                      title={idea.title}
                      contentType={idea.content_type}
                      centralIdea={idea.central_idea}
                      referenceUrl={idea.reference_url}
                      onUpdate={updateIdea}
                      onDelete={deleteIdea}
                    />
                  </div>
                ) : (
                  <Card
                    key={`empty-${index}`}
                    className="h-[400px] border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={createNewIdea}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Plus className="w-8 h-8" />
                      <span className="text-sm">Nova Ideia</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </SortableContext>
        </div>

        <CompactCalendar 
          scheduledIdeas={scheduledIdeas}
          onDayClick={(date) => {
            // TODO: Open modal to show scheduled ideas for this day
            console.log("Clicked day:", date);
          }}
        />
      </div>

      <DragOverlay>
        {activeIdea && (
          <div className="w-[300px] h-[400px]">
            <IdeaCard
              id={activeIdea.id}
              title={activeIdea.title}
              contentType={activeIdea.content_type}
              centralIdea={activeIdea.central_idea}
              referenceUrl={activeIdea.reference_url}
              onUpdate={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
