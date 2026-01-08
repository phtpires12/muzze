import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Shot {
  id: string;
  shotImagePaths?: string[];
  shotImageUrls?: string[];  // DEPRECADO
  scriptSegment: string;
  scene: string;
}

interface ImageGalleryModalProps {
  shots: Shot[];
  resolvedUrls: Map<string, string>;
  currentShotId: string | null;
  onClose: () => void;
}

export const ImageGalleryModal = ({ shots, resolvedUrls, currentShotId, onClose }: ImageGalleryModalProps) => {
  // Flatten all images from all shots into a single array with metadata
  const allImages = shots.flatMap(shot => {
    const paths = shot.shotImagePaths || [];
    return paths
      .map((path, imgIndex) => {
        const url = resolvedUrls.get(path);
        if (!url) return null;
        return {
          url,
          shotId: shot.id,
          shotData: shot,
          imageIndex: imgIndex,
          totalImages: paths.length,
        };
      })
      .filter((img): img is NonNullable<typeof img> => img !== null);
  });
  
  const currentShotImages = allImages.filter(img => img.shotId === currentShotId);
  const startIndex = currentShotImages.length > 0 
    ? allImages.findIndex(img => img.shotId === currentShotId && img.imageIndex === 0)
    : 0;
  
  const [activeIndex, setActiveIndex] = useState(startIndex >= 0 ? startIndex : 0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (startIndex >= 0 && currentShotId) {
      setActiveIndex(startIndex);
      setZoom(1);
    }
  }, [startIndex, currentShotId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, allImages.length]);

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  if (allImages.length === 0) return null;

  const currentImage = allImages[activeIndex];
  const currentShot = currentImage.shotData;
  const originalShotIndex = shots.findIndex(s => s.id === currentShot.id);

  return (
    <Dialog open={currentShotId !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] h-screen w-screen p-0 bg-black/95 border-0">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white">
            <p className="text-sm font-medium">
              Shot #{originalShotIndex + 1} • Imagem {currentImage.imageIndex + 1} de {currentImage.totalImages} • {activeIndex + 1}/{allImages.length} total
            </p>
            <p className="text-xs text-white/70 mt-1 max-w-md truncate">
              {currentShot.scene || currentShot.scriptSegment}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={currentImage.url}
            alt={`Referência Shot #${originalShotIndex + 1} - Imagem ${currentImage.imageIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        </div>

        {/* Navigation Controls - Left */}
        {allImages.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white z-40"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {/* Navigation Controls - Right */}
        {allImages.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white z-40"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 rounded-full p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className={cn(
              "h-10 w-10 rounded-full text-white hover:bg-white/20",
              zoom <= 1 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className={cn(
              "h-10 w-10 rounded-full text-white hover:bg-white/20",
              zoom >= 3 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>

        {/* Thumbnails Strip - Bottom */}
        {allImages.length > 1 && (
          <div className="absolute bottom-24 left-0 right-0 z-40 px-4">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => {
                const shotOriginalIndex = shots.findIndex(s => s.id === img.shotId);
                return (
                  <button
                    key={`${img.shotId}-${img.imageIndex}`}
                    onClick={() => {
                      setActiveIndex(idx);
                      setZoom(1);
                    }}
                    className={cn(
                      "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      idx === activeIndex
                        ? "border-primary scale-110"
                        : "border-white/30 hover:border-white/60"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={`Shot #${shotOriginalIndex + 1} - Img ${img.imageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                      #{shotOriginalIndex + 1}.{img.imageIndex + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
