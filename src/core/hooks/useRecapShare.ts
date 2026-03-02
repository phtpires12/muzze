import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export const useRecapShare = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) {
      console.error("Card ref not available");
      return null;
    }

    try {
      setIsGenerating(true);

      // Generate PNG with high quality
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      return blob;
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const shareImage = useCallback(async (textFallback: string): Promise<void> => {
    const blob = await generateImage();

    if (!blob) {
      // Fallback to text share
      try {
        if (navigator.share) {
          await navigator.share({
            title: "Meu Recap Muzze",
            text: textFallback,
          });
        } else {
          await navigator.clipboard.writeText(textFallback);
          toast.success("Texto copiado para a área de transferência!");
        }
      } catch (err) {
        console.error("Error sharing text:", err);
      }
      return;
    }

    const file = new File([blob], "meu-recap-muzze.png", { type: "image/png" });

    // Check if Web Share API supports files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Meu Recap Muzze",
          text: textFallback,
          files: [file],
        });
        return;
      } catch (err) {
        // User cancelled or error - fallback to download
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing with file:", err);
        }
      }
    }

    // Fallback: download the image
    downloadImage(blob);
  }, [generateImage]);

  const downloadImage = useCallback((blob?: Blob | null) => {
    const download = async () => {
      const imageBlob = blob || await generateImage();
      
      if (!imageBlob) {
        toast.error("Erro ao gerar imagem");
        return;
      }

      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meu-recap-muzze.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Imagem salva!");
    };

    download();
  }, [generateImage]);

  return {
    cardRef,
    isGenerating,
    shareImage,
    downloadImage,
    generateImage,
  };
};
