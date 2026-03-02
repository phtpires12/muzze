import { useState, useEffect } from "react";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { WorkflowCard } from "@/components/content/workflows/WorkflowCard";
import { useWorkflowTemplate } from '@/core/hooks';
import { WorkflowTemplateId } from '@/core/constants';
import { toast } from "sonner";
import { cn } from '@/core/utils';

const Workflows = () => {
  const { 
    currentTemplateId, 
    availableTemplates, 
    setTemplate 
  } = useWorkflowTemplate();
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Find initial index based on active template
  const initialIndex = availableTemplates.findIndex(t => t.id === currentTemplateId);

  useEffect(() => {
    if (!api) return;

    // Set initial slide to active template
    if (initialIndex >= 0) {
      api.scrollTo(initialIndex);
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, initialIndex]);

  const handleSelectTemplate = async (templateId: string) => {
    if (templateId === currentTemplateId) return;

    try {
      await setTemplate(templateId as WorkflowTemplateId);
      toast.success("Workflow atualizado!", {
        description: `Agora você está usando o workflow ${availableTemplates.find(t => t.id === templateId)?.name}`,
      });
    } catch (error) {
      toast.error("Erro ao atualizar workflow");
    }
  };

  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div 
        className="max-w-4xl mx-auto px-4 py-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)' }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Seu Workflow de Criação
          </h1>
          <p className="text-muted-foreground">
            Escolha como você prefere produzir conteúdo
          </p>
        </div>

        {/* Carousel */}
        <div className="relative px-8 mb-8">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {availableTemplates.map((template) => (
                <CarouselItem key={template.id} className="pl-4 md:basis-[85%] lg:basis-[70%]">
                  <WorkflowCard
                    template={template}
                    isActive={template.id === currentTemplateId}
                    onSelect={handleSelectTemplate}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-background shadow-md"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background shadow-md"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {availableTemplates.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                current === index 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-muted/30 border-border/50">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                O que muda?
              </h4>
              <p className="text-sm text-muted-foreground">
                A ordem das colunas no Kanban de Produção e o fluxo de "próximo passo" ao terminar cada etapa. Seu histórico permanece intacto.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Workflows;
