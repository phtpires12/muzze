import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IdeaCard } from "./IdeaCard";
import { CompactCalendar } from "./CompactCalendar";
import { WeekCalendar } from "./WeekCalendar";
import { IdeaCarousel } from "./IdeaCarousel";
import { Paywall, PaywallAction } from "@/components/Paywall";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProfileContext } from "@/contexts/ProfileContext";
import { isDateInCurrentWeek, daysUntilWeekReset } from "@/lib/timezone-utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title?: string | null;
  content_type?: string | null;
  central_idea?: string | null;
  reference_url?: string | null;
  thumbnail_url?: string | null;
  status?: string | null;
  publish_date?: string | null;
}

import { useLongPressSensors, triggerHapticFeedback } from "@/hooks/useLongPressSensors";

export const BrainstormWorkspace = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scheduledIdeas, setScheduledIdeas] = useState<Record<string, Idea[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedIdeas, setSelectedIdeas] = useState<Idea[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('create_script');
  
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const { activeWorkspace } = useWorkspaceContext();
  const { profile } = useProfileContext();
  const planCapabilities = usePlanCapabilitiesOptional();
  const { trackEvent } = useAnalytics();
  const isMobile = deviceType === "mobile";
  const timezone = profile?.timezone || 'America/Sao_Paulo';

  // Sensor otimizado: long press no mobile, drag imediato no desktop
  const sensors = useLongPressSensors();

  useEffect(() => {
    loadIdeas();
    loadScheduledIdeas();
  }, [activeWorkspace?.id]);

  const loadIdeas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeWorkspace?.id) return;

    const { data, error } = await supabase
      .from("scripts")
      .select("id, title, content_type, central_idea, reference_url, thumbnail_url, status, publish_date")
      .eq("workspace_id", activeWorkspace.id)
      .eq("status", "draft_idea")
      .limit(3);
      
    if (error) {
      console.error("Error loading ideas:", error);
      return;
    }

    setIdeas(data || []);
  };

  const loadScheduledIdeas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeWorkspace?.id) return;

    const { data, error } = await supabase
      .from("scripts")
      .select("id, title, content_type, central_idea, reference_url, thumbnail_url, status, publish_date")
      .eq("workspace_id", activeWorkspace.id)
      .eq("status", "draft_idea")
      .not("publish_date", "is", null);

    if (error) {
      console.error("Error loading scheduled ideas:", error);
      return;
    }

    const grouped: Record<string, Idea[]> = {};
    data?.forEach((item) => {
      if (item.publish_date) {
        if (!grouped[item.publish_date]) {
          grouped[item.publish_date] = [];
        }
        grouped[item.publish_date].push(item);
      }
    });

    setScheduledIdeas(grouped);
  };

  const createNewIdea = async () => {
    // Verificar limite do plano
    if (planCapabilities && !planCapabilities.canCreateScript()) {
      trackEvent('paywall_triggered', {
        action: 'create_script',
        plan: planCapabilities.planType,
        usage: planCapabilities.usage.scriptsThisWeek,
        limit: planCapabilities.limits.weeklyScripts,
        context: 'brainstorm',
      });
      setPaywallAction('create_script');
      setPaywallOpen(true);
      return;
    }

    // Limite de 3 ideias simultâneas no workspace (UX, não plano)
    if (ideas.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Você pode trabalhar em até 3 ideias simultaneamente. Agende uma ideia para liberar espaço.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeWorkspace?.id) return;

    const { data, error } = await supabase
      .from("scripts")
      .insert({
        user_id: user.id,
        title: "",
        status: "draft_idea",
        workspace_id: activeWorkspace.id,
      } as any)
      .select("id, title, content_type, central_idea, reference_url, status, publish_date")
      .single() as any;

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
    
    // Atualizar contagem do plano
    planCapabilities?.refetchUsage();
  };

  const updateIdea = async (id: string, updates: { 
    title?: string; 
    content_type?: string; 
    central_idea?: string;
    reference_url?: string;
  }) => {
    const { error } = await supabase
      .from("scripts")
      .update(updates as any)
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
    // Feedback háptico no mobile
    triggerHapticFeedback();
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
    await scheduleIdea(ideaId, targetDate);
  };

  const scheduleIdea = async (ideaId: string, targetDate: string) => {
    // Verificar limite de agendamento futuro
    if (planCapabilities && !planCapabilities.canScheduleToDate(targetDate)) {
      trackEvent('paywall_triggered', {
        action: 'schedule_future',
        plan: planCapabilities.planType,
        target_date: targetDate,
        context: 'brainstorm',
      });
      setPaywallAction('schedule_future');
      setPaywallOpen(true);
      return;
    }

    const idea = ideas.find(i => i.id === ideaId);
    
    if (!idea || !idea.content_type || !idea.central_idea || idea.central_idea.length < 20) {
      toast({
        title: "Ideia incompleta",
        description: "Preencha todos os campos obrigatórios antes de agendar.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("scripts")
      .update({
        publish_date: targetDate,
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
      [targetDate]: [...(scheduledIdeas[targetDate] || []), { ...idea, publish_date: targetDate }],
    });

    toast({
      title: "Ideia agendada!",
      description: `Ideia agendada para ${format(new Date(targetDate), "dd/MM/yyyy")}`,
    });
  };

  const handleMobileSchedule = (ideaId: string) => {
    return (date: Date) => {
      const targetDate = format(date, "yyyy-MM-dd");
      scheduleIdea(ideaId, targetDate);
    };
  };

  const handleDayClick = (dateStr: string, ideas: Idea[]) => {
    if (ideas.length > 0) {
      setSelectedDate(dateStr);
      setSelectedIdeas(ideas);
    }
  };

  const activeIdea = ideas.find(i => i.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex flex-col gap-6 h-full", isMobile && "gap-4")}>
        {isMobile ? (
          <>
            <IdeaCarousel
              ideas={ideas}
              onUpdateIdea={updateIdea}
              onDeleteIdea={deleteIdea}
              onCreateIdea={createNewIdea}
              onScheduleIdea={(ideaId) => handleMobileSchedule(ideaId)}
            />
            
            <WeekCalendar 
              scheduledIdeas={scheduledIdeas}
              onDayClick={handleDayClick}
            />
          </>
        ) : (
          <>
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
                          title={idea.title || undefined}
                          contentType={idea.content_type || undefined}
                          centralIdea={idea.central_idea || undefined}
                          referenceUrl={idea.reference_url || undefined}
                          thumbnailUrl={idea.thumbnail_url || undefined}
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
              onDayClick={handleDayClick}
            />
          </>
        )}
      </div>

      <DragOverlay>
        {activeIdea && (
          <div className="w-[300px] h-[400px]">
            <IdeaCard
              id={activeIdea.id}
              title={activeIdea.title || undefined}
              contentType={activeIdea.content_type || undefined}
              centralIdea={activeIdea.central_idea || undefined}
              referenceUrl={activeIdea.reference_url || undefined}
              thumbnailUrl={activeIdea.thumbnail_url || undefined}
              onUpdate={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
      
      {/* Paywall */}
      <Paywall
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action={paywallAction}
        currentUsage={planCapabilities?.usage.scriptsThisWeek}
        limit={planCapabilities?.limits.weeklyScripts}
        daysUntilReset={daysUntilWeekReset(timezone)}
        context="brainstorm"
      />
    </DndContext>
  );
};
