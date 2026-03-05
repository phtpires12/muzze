import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ExportPDFButton } from "@/components/content/shotlist/ExportPDFButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/core/hooks';
import { ShotItem } from "@/components/content/shotlist/ShotListTable";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageGalleryModal } from "@/components/content/shotlist/ImageGalleryModal";
import { DesignSlideCard } from "./DesignSlideCard";
import { generateSignedUrlsBatch } from '@/core/utils';
import { useWorkflowTemplate } from '@/core/hooks';
import { WorkflowTemplateId, CAROUSEL_SECTIONS } from '@/core/constants';
import { ROUTES } from "@/routes/routes";
import { cn } from "@/core/utils";
import type { Json } from "@/integrations/supabase/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesignWorkspaceProps {
    scriptId?: string;
}

// Wrapper sortable para cada card
const SortableCard = ({
    slide,
    index,
    resolvedUrls,
    isUploadingImage,
    onUpdate,
    onRemove,
    onImageUpload,
    onImageClick,
}: {
    slide: ShotItem;
    index: number;
    resolvedUrls: Map<string, string>;
    isUploadingImage: boolean;
    onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
    onRemove: (id: string) => void;
    onImageUpload: (slideId: string, file: File, currentPaths: string[]) => void;
    onImageClick: (slideId: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <DesignSlideCard
                slide={slide}
                index={index}
                resolvedUrls={resolvedUrls}
                isUploadingImage={isUploadingImage}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onImageUpload={onImageUpload}
                onImageClick={onImageClick}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
};

export const DesignWorkspace: React.FC<DesignWorkspaceProps> = ({ scriptId }) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [slides, setSlides] = useState<ShotItem[]>([]);
    const [resolvedUrls, setResolvedUrls] = useState<Map<string, string>>(new Map());
    const [scriptTitle, setScriptTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedSlides, setLastSavedSlides] = useState<ShotItem[]>([]);
    const [galleryOpenShotId, setGalleryOpenShotId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // Workflow template (always carousel for design stage)
    const [scriptWorkflow] = useState<WorkflowTemplateId>('carousel');
    const { nextStage } = useWorkflowTemplate({ scriptWorkflow });

    // Load design items on mount
    useEffect(() => {
        if (!scriptId || scriptId === 'null' || scriptId === 'undefined') return;
        loadDesignItems();
    }, [scriptId]);

    // Detect unsaved changes
    useEffect(() => {
        if (lastSavedSlides.length > 0) {
            const hasChanges = JSON.stringify(slides) !== JSON.stringify(lastSavedSlides);
            setHasUnsavedChanges(hasChanges);
        }
    }, [slides, lastSavedSlides]);

    // Auto-save with debounce
    const autoSave = useCallback(async (slidesToSave: ShotItem[]) => {
        if (!scriptId || slidesToSave.length === 0) return;
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ design_items: slidesToSave as unknown as Json })
                .eq('id', scriptId);
            if (error) throw error;
            setLastSavedSlides(slidesToSave);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('[DesignWorkspace] Auto-save failed:', error);
        }
    }, [scriptId]);

    useEffect(() => {
        if (slides.length === 0) return;
        const timeoutId = setTimeout(() => autoSave(slides), 2000);
        return () => clearTimeout(timeoutId);
    }, [slides, autoSave]);

    const loadDesignItems = async () => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select('title, design_items, workflow_template')
                .eq('id', scriptId!)
                .single();

            if (error) throw error;
            if (!data) return;

            setScriptTitle(data.title || '');

            const rawItems = data.design_items;
            if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
                const parsedSlides = rawItems as unknown as ShotItem[];

                const allPaths: string[] = [];
                parsedSlides.forEach(slide => {
                    (slide.shotImagePaths || []).forEach(path => {
                        if (path && !allPaths.includes(path)) allPaths.push(path);
                    });
                });

                if (allPaths.length > 0) {
                    const urlMap = await generateSignedUrlsBatch(allPaths, 86400);
                    setResolvedUrls(urlMap);
                }

                setSlides(parsedSlides);
                setLastSavedSlides(parsedSlides);
            }
        } catch (error) {
            console.error('[DesignWorkspace] Error loading design items:', error);
            toast({
                title: "Erro ao carregar slides de design",
                description: "Não foi possível carregar os slides.",
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        if (!scriptId) return;
        setIsSaving(true);
        try {
            const currentSlides = await new Promise<ShotItem[]>((resolve) => {
                setSlides((prev) => { resolve(prev); return prev; });
            });

            const { error } = await supabase
                .from('scripts')
                .update({ design_items: currentSlides as unknown as Json })
                .eq('id', scriptId);

            if (error) throw error;

            setLastSavedSlides(currentSlides);
            setHasUnsavedChanges(false);

            toast({
                title: "Slides salvos!",
                description: "Suas alterações foram salvas com sucesso",
            });
        } catch (error) {
            console.error('[DesignWorkspace] Error saving:', error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar os slides",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const addSlide = (sectionKey: string) => {
        const section = CAROUSEL_SECTIONS.find(s => s.key === sectionKey);

        if (section?.isSingleSlide && slides.some(s => s.sectionName === section.label)) {
            toast({
                title: "Aviso",
                description: `A seção "${section.label}" permite apenas 1 slide.`,
                variant: "destructive"
            });
            return;
        }

        const newSlide: ShotItem = {
            id: crypto.randomUUID(),
            scriptSegment: '',
            scene: '',
            shotImagePaths: [],
            location: '',
            sectionName: section?.label || '',
            isCompleted: false,
        };
        setSlides(prev => [...prev, newSlide]);
    };

    const AddSlideButton = ({ isMobileFab = false, className = '' }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {isMobileFab ? (
                    <Button size="lg" className={cn("fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg z-40 p-0", className)}>
                        <Plus className="w-6 h-6" />
                    </Button>
                ) : (
                    <Button variant="outline" className={cn("gap-2", className)}>
                        <Plus className="w-4 h-4" />
                        Adicionar Slide
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobileFab ? "end" : "start"} className="w-56">
                {CAROUSEL_SECTIONS.map(section => {
                    const exists = section.isSingleSlide && slides.some(s => s.sectionName === section.label);
                    return (
                        <DropdownMenuItem
                            key={section.key}
                            onClick={() => addSlide(section.key)}
                            disabled={exists}
                            className={exists ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            {section.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const updateSlide = (id: string, field: keyof ShotItem, value: string) => {
        setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSlide = (id: string) => {
        setSlides(prev => prev.filter(s => s.id !== id));
    };

    const handleImageUpload = async (slideId: string, file: File, currentPaths: string[]) => {
        if (!scriptId) return;
        if (currentPaths.length >= 3) {
            toast({ title: "Limite atingido", description: "Máximo de 3 imagens por slide", variant: "destructive" });
            return;
        }

        setUploadingImages(prev => new Set(prev).add(slideId));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${user.id}/${scriptId}/${slideId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('shot-references')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const newPaths = [...currentPaths, filePath];
            updateSlide(slideId, 'shotImagePaths', JSON.stringify(newPaths));

            const { data: signedUrlData } = await supabase.storage
                .from('shot-references')
                .createSignedUrl(filePath, 86400);

            if (signedUrlData?.signedUrl) {
                setResolvedUrls(prev => new Map(prev).set(filePath, signedUrlData.signedUrl));
            }

            toast({
                title: "Imagem enviada!",
                description: `${newPaths.length}/3 imagens adicionadas`,
            });
        } catch (error) {
            console.error('[DesignWorkspace] Error uploading image:', error);
            toast({
                title: "Erro no upload",
                description: "Não foi possível enviar a imagem",
                variant: "destructive",
            });
        } finally {
            setUploadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(slideId);
                return newSet;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSlides(items => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleGenerateSlides = async () => {
        if (!scriptId) return;

        try {
            const { data, error } = await supabase
                .from('scripts')
                .select('content')
                .eq('id', scriptId)
                .single();

            if (error || !data?.content) {
                toast({ title: "Erro", description: "Não foi possível carregar o roteiro", variant: "destructive" });
                return;
            }

            const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;

            const generatedSlides: ShotItem[] = [];
            let capaHasMultiple = false;

            CAROUSEL_SECTIONS.forEach(section => {
                const sectionContent = content[section.key];
                const hasContent = sectionContent && typeof sectionContent === 'string' && sectionContent.trim() !== '';

                // Sempre cria pelo menos um slide por seção (mesmo vazio)
                if (!hasContent) {
                    generatedSlides.push({
                        id: crypto.randomUUID(),
                        scriptSegment: '',
                        scene: '',
                        shotImagePaths: [],
                        location: '',
                        sectionName: section.label,
                        isCompleted: false,
                    });
                    return;
                }

                const parts = sectionContent.split(/<br\s*\/?>/gi).filter((p: string) => p.trim() !== '');

                if (parts.length === 0) {
                    // Conteúdo que virou vazio após split (ex: só tinha <br>)
                    generatedSlides.push({
                        id: crypto.randomUUID(),
                        scriptSegment: '',
                        scene: '',
                        shotImagePaths: [],
                        location: '',
                        sectionName: section.label,
                        isCompleted: false,
                    });
                    return;
                }

                if (section.isSingleSlide && parts.length > 1) {
                    capaHasMultiple = true;
                    generatedSlides.push({
                        id: crypto.randomUUID(),
                        scriptSegment: sectionContent,
                        scene: '',
                        shotImagePaths: [],
                        location: '',
                        sectionName: section.label,
                        isCompleted: false,
                    });
                } else {
                    parts.forEach((part: string) => {
                        generatedSlides.push({
                            id: crypto.randomUUID(),
                            scriptSegment: part.trim(),
                            scene: '',
                            shotImagePaths: [],
                            location: '',
                            sectionName: section.label,
                            isCompleted: false,
                        });
                    });
                }
            });

            // Sempre há slides (uma por seção), mas mantemos o aviso caso nenhuma seção tenha sido definida
            if (generatedSlides.length === 0) {
                toast({ title: "Aviso", description: "Nenhuma seção com conteúdo no roteiro", variant: "destructive" });
                return;
            }

            setSlides(generatedSlides);

            if (capaHasMultiple) {
                toast({
                    title: "Aviso: Quebras ignoradas",
                    description: "Quebras de página (Shift+Enter) ignoradas na Capa pois ela permite apenas 1 slide.",
                });
            } else {
                toast({ title: "Slides gerados!", description: `${generatedSlides.length} slides criados a partir do roteiro` });
            }
        } catch (error) {
            console.error('[DesignWorkspace] Error generating slides:', error);
            toast({ title: "Erro", description: "Não foi possível gerar os slides", variant: "destructive" });
        }
    };

    const handleDeleteAll = async () => {
        if (!scriptId) return;
        setIsDeleting(true);

        try {
            const allImagePaths: string[] = [];
            slides.forEach(slide => {
                (slide.shotImagePaths || []).forEach(path => {
                    if (path && !allImagePaths.includes(path)) allImagePaths.push(path);
                });
            });

            if (allImagePaths.length > 0) {
                await supabase.storage.from('shot-references').remove(allImagePaths);
            }

            const { error } = await supabase
                .from('scripts')
                .update({ design_items: [] })
                .eq('id', scriptId);

            if (error) throw error;

            setSlides([]);
            setLastSavedSlides([]);
            setHasUnsavedChanges(false);

            toast({ title: "Slides excluídos", description: "Você pode gerar novos slides ou adicionar manualmente" });
        } catch (error) {
            console.error('[DesignWorkspace] Error deleting:', error);
            toast({ title: "Erro ao excluir", description: "Não foi possível excluir os slides", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!scriptId) return;

        await handleSave();

        const next = nextStage('design');

        await supabase
            .from('scripts')
            .update({ status: next || 'design' })
            .eq('id', scriptId);

        toast({ title: "Design concluído! 🎉", description: "Seu carrossel foi marcado como concluído." });
        navigate(ROUTES.CALENDARIO);
    };

    return (
        <div
            className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
            <div className="max-w-[1400px] mx-auto">

                {/* Mobile Header */}
                <div className="md:hidden mb-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/session?stage=review&scriptId=${scriptId}`)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-foreground">Design — Carrossel</h1>
                            <p className="text-xs text-muted-foreground truncate">{scriptTitle}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateSlides} size="sm" variant="ghost" className="px-2" title="Gerar slides do roteiro">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setShowDeleteModal(true)} size="sm" variant="ghost" className="px-2 text-destructive" title="Excluir todos">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <ExportPDFButton shots={slides} scriptTitle={scriptTitle} mode="review" size="icon" variant="ghost" iconOnly />
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            size="sm"
                            variant="outline"
                            className={cn("flex-1", hasUnsavedChanges && "border-orange-500 text-orange-500")}
                        >
                            {isSaving ? 'Salvando...' : hasUnsavedChanges ? '● Salvar' : 'Salvo ✓'}
                        </Button>
                        <Button onClick={handleMarkComplete} size="sm" className="flex-1">Concluir</Button>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/session?stage=review&scriptId=${scriptId}`)}
                            className="hover:bg-accent/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para Revisão
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Design — Carrossel</h1>
                            <p className="text-sm text-muted-foreground">{scriptTitle}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <ExportPDFButton shots={slides} scriptTitle={scriptTitle} mode="review" variant="outline" size="sm" />
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            variant="outline"
                            className={hasUnsavedChanges ? "border-orange-500 text-orange-500" : ""}
                        >
                            {isSaving ? 'Salvando...' : hasUnsavedChanges ? '● Salvar' : 'Salvo ✓'}
                        </Button>
                        <Button
                            onClick={handleMarkComplete}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white"
                        >
                            ✓ Marcar como Concluído
                        </Button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="hidden md:flex gap-2 mb-6">
                    <AddSlideButton />
                    <Button onClick={handleGenerateSlides} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Gerar Slides do Roteiro
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setShowDeleteModal(true)}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir Tudo
                    </Button>
                </div>

                {/* Mobile FAB */}
                <div className="md:hidden">
                    <AddSlideButton isMobileFab />
                </div>

                {/* Gallery Grid */}
                {slides.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={slides.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                            <div className="flex flex-wrap gap-4 pb-4">
                                {slides.map((slide, index) => (
                                    <SortableCard
                                        key={slide.id}
                                        slide={slide}
                                        index={index}
                                        resolvedUrls={resolvedUrls}
                                        isUploadingImage={uploadingImages.has(slide.id)}
                                        onUpdate={updateSlide}
                                        onRemove={removeSlide}
                                        onImageUpload={handleImageUpload}
                                        onImageClick={(slideId) => setGalleryOpenShotId(slideId)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="text-center py-24 text-muted-foreground space-y-4">
                        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                            <Plus className="w-10 h-10 opacity-30" />
                        </div>
                        <div>
                            <p className="font-medium text-lg">Nenhum slide ainda</p>
                            <p className="text-sm mt-1 max-w-sm mx-auto">
                                Clique em <strong>"Gerar Slides do Roteiro"</strong> para criar slides automáticos,
                                ou <strong>"Adicionar Slide"</strong> para criar manualmente.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <Button onClick={handleGenerateSlides} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Gerar Slides do Roteiro
                            </Button>
                            <AddSlideButton />
                        </div>
                    </div>
                )}
            </div>

            {/* Image Gallery Modal */}
            <ImageGalleryModal
                shots={slides}
                resolvedUrls={resolvedUrls}
                currentShotId={galleryOpenShotId}
                onClose={() => setGalleryOpenShotId(null)}
            />

            {/* Delete Confirmation Modal */}
            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir todos os slides?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação vai apagar todos os slides e imagens desta área de design. Não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAll}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir Tudo'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
