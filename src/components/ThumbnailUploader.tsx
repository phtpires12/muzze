import { useState, useRef } from 'react';
import { ImagePlus, X, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ThumbnailUploaderProps {
  thumbnailUrl: string | null;
  onThumbnailChange: (url: string | null) => void;
  scriptId?: string;
}

export const ThumbnailUploader = ({ 
  thumbnailUrl, 
  onThumbnailChange,
  scriptId 
}: ThumbnailUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const validateAspectRatio = (file: File): Promise<{ valid: boolean; ratio: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const targetRatio = 16 / 9; // ~1.777
        const tolerance = 0.15; // 15% de tolerância
        const valid = Math.abs(ratio - targetRatio) <= tolerance;
        URL.revokeObjectURL(img.src);
        resolve({ valid, ratio });
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: false, ratio: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate aspect ratio
    const { valid, ratio } = await validateAspectRatio(file);
    if (!valid) {
      const actualRatio = ratio.toFixed(2);
      toast({
        title: "Proporção incorreta",
        description: `A thumbnail deve estar no formato 16:9 (ex: 1280x720, 1920x1080). A imagem enviada tem proporção ${actualRatio}:1.`,
        variant: "destructive",
      });
      return;
    }

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${scriptId || 'temp'}_${Date.now()}.${fileExt}`;

      // Delete old thumbnail if exists
      if (thumbnailUrl) {
        const oldPath = thumbnailUrl.split('/thumbnails/')[1];
        if (oldPath) {
          await supabase.storage.from('thumbnails').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      onThumbnailChange(publicUrl);
      toast({
        title: "Thumbnail adicionada",
        description: "Sua thumbnail foi carregada com sucesso.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (thumbnailUrl) {
      try {
        const path = thumbnailUrl.split('/thumbnails/')[1];
        if (path) {
          await supabase.storage.from('thumbnails').remove([path]);
        }
      } catch (error) {
        console.error('Error removing thumbnail:', error);
      }
    }
    onThumbnailChange(null);
    toast({
      title: "Thumbnail removida",
    });
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleFileSelect}
      className="hidden"
    />
  );

  // Empty state - show add button
  if (!thumbnailUrl) {
    return (
      <div className="mb-4">
        {fileInput}
        <button
          onClick={handleTriggerUpload}
          disabled={isUploading}
          className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-muted-foreground",
            "transition-colors py-2 group",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <ImagePlus className="w-4 h-4" />
          <span>{isUploading ? "Carregando..." : "Adicionar Thumbnail"}</span>
          <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground/70">
            (16:9)
          </span>
        </button>
      </div>
    );
  }

  // Has thumbnail - show preview with overlay controls
  return (
    <div className="mb-4">
      {fileInput}
      <div 
        className="relative w-full aspect-video max-w-2xl rounded-lg overflow-hidden border border-border bg-muted"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          src={thumbnailUrl}
          alt="Thumbnail preview"
          className="w-full h-full object-cover"
        />
        
        {/* Hover overlay with controls */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity duration-200",
            isHovering ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerUpload}
            disabled={isUploading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isUploading && "animate-spin")} />
            {isUploading ? "Carregando..." : "Trocar"}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Remover
          </Button>
          
          {/* Future AI button - disabled for now */}
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="gap-2 opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <Sparkles className="w-4 h-4" />
            Gerar com IA
          </Button>
        </div>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Formato recomendado: 1280x720 ou 1920x1080 (16:9)
      </p>
    </div>
  );
};
