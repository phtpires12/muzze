import React, { useRef, useState } from "react";
import { ImageIcon, Upload, X, Loader2, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils";
import { stripHtmlToPlainText } from "@/core/utils";
import { ShotItem } from "@/components/content/shotlist/ShotListTable";

interface DesignSlideCardProps {
    slide: ShotItem;
    index: number;
    resolvedUrls: Map<string, string>;
    isUploadingImage: boolean;
    onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
    onRemove: (id: string) => void;
    onImageUpload: (slideId: string, file: File, currentPaths: string[]) => void;
    onImageClick: (slideId: string) => void;
    /** drag handle attributes from @dnd-kit/sortable */
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const DesignSlideCard: React.FC<DesignSlideCardProps> = ({
    slide,
    index,
    resolvedUrls,
    isUploadingImage,
    onUpdate,
    onRemove,
    onImageUpload,
    onImageClick,
    dragHandleProps,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Parse image paths
    const imagePaths: string[] = (() => {
        if (!slide.shotImagePaths) return [];
        if (Array.isArray(slide.shotImagePaths)) return slide.shotImagePaths as string[];
        try {
            const parsed = JSON.parse(slide.shotImagePaths as unknown as string);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const firstImageUrl = imagePaths.length > 0 ? resolvedUrls.get(imagePaths[0]) : null;
    const canUploadMore = imagePaths.length < 3;

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            onImageUpload(slide.id, file, imagePaths);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload(slide.id, file, imagePaths);
            e.target.value = "";
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const newPaths = imagePaths.filter(p => p !== path);
        onUpdate(slide.id, "shotImagePaths", JSON.stringify(newPaths));
    };

    return (
        <div className="group relative flex flex-col rounded-2xl bg-card border border-border/40 overflow-hidden shadow-md hover:shadow-lg hover:border-border/60 transition-all duration-200 w-[280px] md:w-[300px] flex-shrink-0">
            {/* Drag Handle */}
            <div
                {...dragHandleProps}
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Delete button */}
            <button
                onClick={() => onRemove(slide.id)}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity bg-background/80 rounded-full p-1 hover:bg-destructive/10 hover:text-destructive"
                title="Remover slide"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Section badge */}
            {slide.sectionName && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/90 text-primary-foreground shadow-sm whitespace-nowrap">
                        {slide.sectionName}
                    </span>
                </div>
            )}

            {/* Image area */}
            <div
                className={cn(
                    "relative w-full aspect-[4/3] bg-muted/30 flex items-center justify-center cursor-pointer transition-colors",
                    isDragOver && "bg-primary/10 border-2 border-primary border-dashed",
                    canUploadMore && "hover:bg-muted/50"
                )}
                onClick={() => {
                    if (firstImageUrl) {
                        onImageClick(slide.id);
                    } else if (canUploadMore) {
                        fileInputRef.current?.click();
                    }
                }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
            >
                {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs">Enviando...</span>
                    </div>
                ) : firstImageUrl ? (
                    <>
                        <img
                            src={firstImageUrl}
                            alt="Referência do slide"
                            className="w-full h-full object-cover"
                        />
                        {/* Image count badge */}
                        {imagePaths.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] rounded-full px-2 py-0.5 font-medium">
                                +{imagePaths.length - 1}
                            </div>
                        )}
                        {/* Hover overlay with remove first image */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                            <button
                                onClick={e => handleRemoveImage(e, imagePaths[0])}
                                className="opacity-0 hover:opacity-100 bg-black/60 text-white rounded-full p-1.5 transition-opacity"
                                title="Remover imagem"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60 select-none">
                        <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
                            {canUploadMore ? (
                                <Upload className="w-5 h-5" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                        </div>
                        <span className="text-xs font-medium">
                            {canUploadMore ? "Adicionar referência" : "Limite atingido"}
                        </span>
                    </div>
                )}

                {/* Upload button overlay when has image and can add more */}
                {firstImageUrl && canUploadMore && (
                    <button
                        onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="absolute bottom-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                        title={`Adicionar outra imagem (${imagePaths.length}/3)`}
                    >
                        <Upload className="w-3 h-3" />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-2 p-3 flex-1">
                {/* Slide number */}
                <span className="text-[10px] text-muted-foreground/60 font-medium">#{index + 1}</span>

                {/* Script text */}
                <textarea
                    value={stripHtmlToPlainText(slide.scriptSegment)}
                    onChange={e => onUpdate(slide.id, "scriptSegment", e.target.value)}
                    placeholder="Texto do slide..."
                    rows={4}
                    className={cn(
                        "w-full text-sm text-foreground bg-transparent resize-none",
                        "focus:outline-none placeholder:text-muted-foreground/40",
                        "leading-relaxed"
                    )}
                />
            </div>
        </div>
    );
};
