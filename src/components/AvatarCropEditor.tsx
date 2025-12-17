import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropEditorProps {
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const CANVAS_SIZE = 300;
const CIRCLE_RADIUS = 120;
const OUTPUT_SIZE = 256;

export const AvatarCropEditor = ({ onSave, onCancel }: AvatarCropEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image if loaded
    if (image) {
      const scale = zoom;
      const imgWidth = image.width * scale;
      const imgHeight = image.height * scale;
      const centerX = CANVAS_SIZE / 2;
      const centerY = CANVAS_SIZE / 2;
      
      ctx.save();
      ctx.drawImage(
        image,
        centerX - imgWidth / 2 + offset.x,
        centerY - imgHeight / 2 + offset.y,
        imgWidth,
        imgHeight
      );
      ctx.restore();
    }

    // Draw dark overlay outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Draw circle border
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw rule of thirds grid inside circle
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    
    // Create circular clip
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.clip();
    
    const gridSize = (CIRCLE_RADIUS * 2) / 3;
    const gridStart = CANVAS_SIZE / 2 - CIRCLE_RADIUS;
    
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(gridStart + gridSize, gridStart);
    ctx.lineTo(gridStart + gridSize, gridStart + CIRCLE_RADIUS * 2);
    ctx.moveTo(gridStart + gridSize * 2, gridStart);
    ctx.lineTo(gridStart + gridSize * 2, gridStart + CIRCLE_RADIUS * 2);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(gridStart, gridStart + gridSize);
    ctx.lineTo(gridStart + CIRCLE_RADIUS * 2, gridStart + gridSize);
    ctx.moveTo(gridStart, gridStart + gridSize * 2);
    ctx.lineTo(gridStart + CIRCLE_RADIUS * 2, gridStart + gridSize * 2);
    ctx.stroke();
    
    ctx.restore();
  }, [image, zoom, offset]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      // Calculate initial zoom to fit image in circle
      const minDim = Math.min(img.width, img.height);
      const initialZoom = (CIRCLE_RADIUS * 2) / minDim;
      setZoom(Math.max(initialZoom, 0.1));
      setOffset({ x: 0, y: 0 });
      setImage(img);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !image) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!image) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !image) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleSave = async () => {
    if (!image) return;
    
    setSaving(true);
    
    // Create output canvas for circular crop
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext("2d");
    
    if (!ctx) {
      setSaving(false);
      return;
    }

    // Create circular clip
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Calculate scale from preview to output
    const scaleFactor = OUTPUT_SIZE / (CIRCLE_RADIUS * 2);
    
    // Draw image with same relative position and zoom
    const imgWidth = image.width * zoom * scaleFactor;
    const imgHeight = image.height * zoom * scaleFactor;
    const centerX = OUTPUT_SIZE / 2;
    const centerY = OUTPUT_SIZE / 2;
    
    ctx.drawImage(
      image,
      centerX - imgWidth / 2 + offset.x * scaleFactor,
      centerY - imgHeight / 2 + offset.y * scaleFactor,
      imgWidth,
      imgHeight
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
        }
        setSaving(false);
      },
      "image/png",
      1.0
    );
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Enquadrar Foto</DialogTitle>
      </DialogHeader>
      
      <div className="flex flex-col items-center gap-4">
        {!image ? (
          <div
            className="w-[300px] h-[300px] border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Clique para selecionar uma foto
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-lg cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {image && (
          <div className="w-full flex items-center gap-3 px-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.1}
              max={3}
              step={0.01}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {image && (
          <p className="text-xs text-muted-foreground text-center">
            Arraste para mover • Use o controle para zoom
          </p>
        )}

        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          {image ? (
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          ) : (
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
              Selecionar Foto
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
};
