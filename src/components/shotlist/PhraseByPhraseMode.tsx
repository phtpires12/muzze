import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Maximize2, Minimize2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";

interface ContentSections {
  gancho?: string;
  setup?: string;
  desenvolvimento?: string;
  conclusao?: string;
}

interface PhraseByPhraseModeProps {
  scriptId: string;
  scriptTitle: string;
  scriptContent: ContentSections | null;
  onAdvanceToEdit: () => Promise<void>;
  onBack: () => void;
  // Session props (compatível com useSession)
  session: {
    isActive: boolean;
    isPaused: boolean;
    elapsedSeconds: number;
    targetSeconds: number;
    isStreakMode: boolean;
    dailyGoalMinutes: number;
    dailyBaselineSeconds: number;
  };
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => Promise<void>;
  isShowingAnyCelebration: boolean;
  canUseTimer: boolean;
  // Toggle mode props
  canSwitchToShotList?: boolean;
  onSwitchToShotList?: () => void;
}

/**
 * Converte HTML para texto puro, preservando quebras de linha
 */
const htmlToPlainText = (html: string): string => {
  if (!html) return "";
  
  // Criar um elemento temporário para parsear o HTML
  const doc = new DOMParser().parseFromString(html, "text/html");
  
  // Substituir <br> e </p> por quebras de linha
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      let result = "";
      node.childNodes.forEach((child) => {
        result += processNode(child);
      });
      
      // Adicionar quebra de linha após elementos de bloco
      if (["p", "div", "br", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
        result += "\n";
      }
      
      return result;
    }
    
    return "";
  };
  
  return processNode(doc.body).trim();
};

/**
 * Segmenta o texto em frases/chunks para o teleprompter
 */
const parseContentToPhrases = (content: ContentSections | null): string[] => {
  if (!content) return [];
  
  // Concatenar todas as seções na ordem
  const sections = [
    content.gancho,
    content.setup,
    content.desenvolvimento,
    content.conclusao,
  ].filter(Boolean);
  
  const fullText = sections.join("\n\n");
  
  // Converter HTML para texto puro
  const plainText = htmlToPlainText(fullText);
  
  // Dividir por . ? ! e por \n
  // Regex: quebra após pontuação final (mantendo a pontuação) ou em quebras de linha
  const chunks = plainText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
  
  return chunks;
};

export const PhraseByPhraseMode = ({
  scriptId,
  scriptTitle,
  scriptContent,
  onAdvanceToEdit,
  onBack,
  session,
  onPauseSession,
  onResumeSession,
  onEndSession,
  
  isShowingAnyCelebration,
  canUseTimer,
  canSwitchToShotList,
  onSwitchToShotList,
}: PhraseByPhraseModeProps) => {
  const [phrases, setPhrases] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompactView, setIsCompactView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Carregar frases e restaurar índice salvo
  useEffect(() => {
    const parsedPhrases = parseContentToPhrases(scriptContent);
    setPhrases(parsedPhrases);
    
    // Restaurar índice salvo do localStorage
    const savedIndex = localStorage.getItem(`phrase-index-${scriptId}`);
    if (savedIndex) {
      const index = parseInt(savedIndex, 10);
      if (index >= 0 && index < parsedPhrases.length) {
        setCurrentIndex(index);
      }
    }
    
    // Restaurar modo de visualização
    const savedViewMode = localStorage.getItem(`phrase-view-mode-${scriptId}`);
    if (savedViewMode) {
      setIsCompactView(savedViewMode === "compact");
    }
    
    setIsLoading(false);
  }, [scriptId, scriptContent]);

  // Persistir índice atual
  useEffect(() => {
    if (phrases.length > 0) {
      localStorage.setItem(`phrase-index-${scriptId}`, currentIndex.toString());
    }
  }, [currentIndex, scriptId, phrases.length]);

  // Persistir modo de visualização
  useEffect(() => {
    localStorage.setItem(`phrase-view-mode-${scriptId}`, isCompactView ? "compact" : "full");
  }, [isCompactView, scriptId]);

  // Auto-scroll para manter a frase atual visível
  useEffect(() => {
    const phraseElement = phraseRefs.current.get(currentIndex);
    if (phraseElement) {
      phraseElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === "ArrowRight" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, phrases.length - 1));
      } else if (e.key === "ArrowLeft" || (e.key === "Enter" && e.shiftKey)) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phrases.length]);

  const handlePhraseClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, phrases.length - 1));
  };

  // Calcular progresso do timer
  const timerProgress = session.isStreakMode
    ? Math.min((session.elapsedSeconds / (session.dailyGoalMinutes * 60)) * 100, 100)
    : Math.min((session.elapsedSeconds / session.targetSeconds) * 100, 100);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando teleprompter...</div>
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Nenhum conteúdo encontrado no roteiro.</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Revisão
        </Button>
      </div>
    );
  }

  // Modo Compacto: mostra apenas 1 anterior, atual, 1 próxima
  // Modo Completo: mostra todas as frases com destaque na atual
  const getVisiblePhrases = () => {
    if (!isCompactView) {
      return phrases.map((phrase, index) => ({ phrase, index }));
    }
    
    // Modo compacto: apenas 3 frases (anterior, atual, próxima)
    const visible = [];
    if (currentIndex > 0) {
      visible.push({ phrase: phrases[currentIndex - 1], index: currentIndex - 1 });
    }
    visible.push({ phrase: phrases[currentIndex], index: currentIndex });
    if (currentIndex < phrases.length - 1) {
      visible.push({ phrase: phrases[currentIndex + 1], index: currentIndex + 1 });
    }
    return visible;
  };

  const visiblePhrases = getVisiblePhrases();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - com safe-area para Dynamic Island */}
      <div 
        className="sticky z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div 
          className="flex items-center justify-between p-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">Teleprompter</h1>
              <p className="text-xs text-muted-foreground truncate">{scriptTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Modo Visualização */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCompactView(!isCompactView)}
              title={isCompactView ? "Modo completo" : "Modo focado"}
            >
              {isCompactView ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>

            {/* Botão para alternar para Modo Shot List */}
            {canSwitchToShotList && onSwitchToShotList && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToShotList}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Shot List</span>
              </Button>
            )}

            {/* Botão Avançar para Edição */}
            <Button
              onClick={onAdvanceToEdit}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <span className="hidden sm:inline mr-2">Edição</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área principal do teleprompter */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-8",
          isCompactView && "flex flex-col justify-center"
        )}
      >
        <div className={cn("max-w-2xl mx-auto space-y-4", isCompactView && "space-y-6")}>
          {visiblePhrases.map(({ phrase, index }) => {
            const isCurrent = index === currentIndex;
            const distance = Math.abs(index - currentIndex);
            
            // Calcular opacidade baseada na distância
            let opacity = 1;
            if (!isCurrent) {
              if (isCompactView) {
                opacity = 0.3;
              } else {
                // Modo completo: gradiente de opacidade
                opacity = distance === 1 ? 0.5 : distance === 2 ? 0.3 : 0.2;
              }
            }

            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) {
                    phraseRefs.current.set(index, el);
                  } else {
                    phraseRefs.current.delete(index);
                  }
                }}
                onClick={() => handlePhraseClick(index)}
                className={cn(
                  "transition-all duration-300 cursor-pointer rounded-lg p-4",
                  isCurrent
                    ? "bg-primary/10 border-2 border-primary scale-105 shadow-lg"
                    : "hover:bg-muted/50"
                )}
                style={{ opacity }}
              >
                <p
                  className={cn(
                    "transition-all duration-300 leading-relaxed",
                    isCurrent
                      ? "text-2xl sm:text-3xl font-semibold text-foreground"
                      : "text-lg sm:text-xl text-muted-foreground"
                  )}
                >
                  {phrase}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra de controle fixa inferior */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            disabled={currentIndex === 0}
            onClick={goToPrevious}
            className="h-12 w-12"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tabular-nums">
              {currentIndex + 1} / {phrases.length}
            </span>
            <span className="text-xs text-muted-foreground">
              ← → ou Enter para navegar
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={currentIndex === phrases.length - 1}
            onClick={goToNext}
            className="h-12 w-12"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Timer flutuante */}
      {session.isActive && !isShowingAnyCelebration && canUseTimer && (
        <DraggableSessionTimer
          stage="Gravação"
          icon={session.isStreakMode ? "Flame" : "Video"}
          elapsedSeconds={session.elapsedSeconds}
          targetSeconds={session.isStreakMode 
            ? session.dailyGoalMinutes * 60 
            : session.targetSeconds}
          isPaused={session.isPaused}
          isStreakMode={session.isStreakMode}
          dailyGoalMinutes={session.dailyGoalMinutes}
          onPause={onPauseSession}
          onResume={onResumeSession}
          onStop={onEndSession}
          progress={timerProgress}
          dailyBaselineSeconds={session.dailyBaselineSeconds}
          permissionEnabled={canUseTimer}
          hidden={isShowingAnyCelebration}
        />
      )}
      <AutoHideNav />
    </div>
  );
};
