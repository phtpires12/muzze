import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { ShotItem } from "./ShotListTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import muzzeLogoGradient from "@/assets/muzze-leaf-gradient.png";

interface ExportPDFButtonProps {
  shots: ShotItem[];
  scriptTitle: string;
  mode: 'review' | 'record';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  iconOnly?: boolean;
}

// Helper function to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export function ExportPDFButton({ 
  shots, 
  scriptTitle, 
  mode, 
  variant = 'outline',
  size = 'default',
  iconOnly = false 
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const { toast } = useToast();

  // Pre-load logo as base64
  useEffect(() => {
    fetch(muzzeLogoGradient)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => console.warn('Failed to load Muzze logo'));
  }, []);

  // Check if any shot has images
  const hasImages = shots.some(s => s.shotImageUrls && s.shotImageUrls.length > 0);

  const handleExportClick = () => {
    if (shots.length === 0) {
      toast({
        title: "Shot List vazia",
        description: "Adicione takes antes de exportar",
        variant: "destructive",
      });
      return;
    }
    setShowExportDialog(true);
  };

  const generatePDF = async () => {
    setShowExportDialog(false);
    setIsGenerating(true);

    try {
      // Pre-load images if needed
      const imageCache = new Map<string, string>();
      
      if (includeImages) {
        const allImageUrls = shots.flatMap(s => s.shotImageUrls || []);
        if (allImageUrls.length > 0) {
          toast({
            title: "Carregando imagens...",
            description: `Processando ${allImageUrls.length} imagens`,
          });
          
          const imagePromises = allImageUrls.map(async url => {
            const base64 = await loadImageAsBase64(url);
            if (base64) imageCache.set(url, base64);
          });
          await Promise.all(imagePromises);
        }
      }

      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto preparamos o documento",
      });

      // Create PDF document (A4 size)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Colors
      const primaryColor = [139, 92, 246]; // Purple
      const textColor = [26, 26, 26];
      const mutedColor = [107, 114, 128];
      const borderColor = [229, 231, 235];
      const alternateRowColor = [249, 250, 251];

      // Helper function to add header
      const addHeader = (pageNum: number, totalPages: number) => {
        // Muzze Logo
        if (logoBase64) {
          try {
            pdf.addImage(logoBase64, 'PNG', margin, 8, 14, 14);
          } catch (e) {
            console.warn('Failed to add logo to PDF');
          }
        }

        // Title
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const title = scriptTitle.length > 40 ? scriptTitle.substring(0, 40) + '...' : scriptTitle;
        pdf.text(title, margin + 17, 17);

        // Mode badge
        const modeText = mode === 'review' ? 'Revisão' : 'Gravação';
        pdf.setFontSize(8);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text(modeText, margin + 18, 23);

        // Date (right aligned)
        pdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const date = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        pdf.text(date, pageWidth - margin, 17, { align: 'right' });

        // Separator line
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(0.3);
        pdf.line(margin, 28, pageWidth - margin, 28);
      };

      // Helper function to add footer
      const addFooter = (pageNum: number, totalPages: number) => {
        pdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        // Created with Muzze
        pdf.text('Criado com Muzze | muzze.app', margin, pageHeight - 10);
        
        // Page number
        pdf.text(`${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      };

      // Table settings
      const tableTop = 35;
      const lineHeight = 3.5; // Height per line of text in mm
      const cellPadding = 4; // Vertical padding for cells
      const imgSize = 22; // Thumbnail size in mm
      
      // Column widths - ordem: # | Trecho | Cena | Imagem | Locação | [Status]
      const colWidths = mode === 'record' 
        ? { num: 8, text: 52, scene: 38, image: 28, location: 38, status: 16 }
        : { num: 8, text: 58, scene: 42, image: 28, location: 44 };

      // Calculate dynamic row height based on content
      const getRowHeight = (shot: ShotItem): number => {
        // Measure text lines for each column
        pdf.setFontSize(8);
        const textColWidth = colWidths.text - 4;
        const sceneColWidth = colWidths.scene - 4;
        const locationColWidth = colWidths.location - 4;
        
        const textLines = pdf.splitTextToSize(shot.scriptSegment || '', textColWidth);
        const sceneLines = pdf.splitTextToSize(shot.scene || '-', sceneColWidth);
        const locationLines = pdf.splitTextToSize(shot.location || '-', locationColWidth);
        
        // Max lines from text columns
        const maxTextLines = Math.max(textLines.length, sceneLines.length, locationLines.length);
        const textHeight = (maxTextLines * lineHeight) + cellPadding;
        
        // Image height if images are enabled
        const hasImages = includeImages && shot.shotImageUrls && shot.shotImageUrls.length > 0;
        const imageHeight = hasImages ? imgSize + 6 : 0;
        
        // Return max of text height, image height, or minimum
        return Math.max(textHeight, imageHeight, 14);
      };

      // Helper function to add table header
      const addTableHeader = (y: number) => {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 8, 'F');
        
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        
        let xPos = margin + 2;
        pdf.text('#', xPos, y + 5.5);
        xPos += colWidths.num;
        pdf.text('Trecho do Roteiro', xPos, y + 5.5);
        xPos += colWidths.text;
        pdf.text('Cena', xPos, y + 5.5);
        xPos += colWidths.scene;
        pdf.text('Imagem', xPos, y + 5.5);
        xPos += colWidths.image;
        pdf.text('Locação', xPos, y + 5.5);
        if (mode === 'record') {
          xPos += colWidths.location;
          pdf.text('Status', xPos, y + 5.5);
        }
        
        return y + 10;
      };

      // Calculate total pages (estimate based on average height)
      const avgRowHeight = includeImages ? 30 : 18;
      const availableHeight = pageHeight - tableTop - 25;
      const estimatedRowsPerPage = Math.floor(availableHeight / avgRowHeight);
      let totalPages = Math.ceil(shots.length / estimatedRowsPerPage);

      let currentPage = 1;
      let currentY = tableTop;

      // Add first page header and table header
      addHeader(currentPage, totalPages);
      currentY = addTableHeader(currentY);

      // Render shots
      shots.forEach((shot, index) => {
        const rowHeight = getRowHeight(shot);
        
        // Check if need new page
        if (currentY + rowHeight > pageHeight - 20) {
          addFooter(currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          if (currentPage > totalPages) totalPages = currentPage;
          addHeader(currentPage, totalPages);
          currentY = addTableHeader(tableTop);
        }

        // Alternate row background
        if (index % 2 === 1) {
          pdf.setFillColor(alternateRowColor[0], alternateRowColor[1], alternateRowColor[2]);
          pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
        }

        // Row border
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(0.1);
        pdf.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

        // Row content
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        const textStartY = currentY + 4; // Consistent top alignment
        let xPos = margin + 2;
        
        // Column 1: Number
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(index + 1), xPos, textStartY);
        pdf.setFont('helvetica', 'normal');
        xPos += colWidths.num;

        // Column 2: Trecho do Roteiro (full text with word wrap)
        const textLines = pdf.splitTextToSize(shot.scriptSegment || '', colWidths.text - 4);
        textLines.forEach((line: string, i: number) => {
          pdf.text(line, xPos, textStartY + (i * lineHeight));
        });
        xPos += colWidths.text;

        // Column 3: Cena (full text with word wrap)
        const sceneLines = pdf.splitTextToSize(shot.scene || '-', colWidths.scene - 4);
        sceneLines.forEach((line: string, i: number) => {
          pdf.text(line, xPos, textStartY + (i * lineHeight));
        });
        xPos += colWidths.scene;

        // Column 4: Imagem de Referência
        const imageColX = xPos;
        if (includeImages && shot.shotImageUrls && shot.shotImageUrls.length > 0) {
          const imgY = currentY + 2;
          const firstImageUrl = shot.shotImageUrls[0];
          const base64 = imageCache.get(firstImageUrl);
          
          if (base64) {
            try {
              pdf.addImage(base64, 'JPEG', imageColX, imgY, imgSize, imgSize);
            } catch (e) {
              // Placeholder if image fails
              pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
              pdf.setFillColor(alternateRowColor[0], alternateRowColor[1], alternateRowColor[2]);
              pdf.rect(imageColX, imgY, imgSize, imgSize, 'FD');
            }
          }
          
          // Indicator for additional images
          if (shot.shotImageUrls.length > 1) {
            pdf.setFontSize(7);
            pdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
            pdf.text(`+${shot.shotImageUrls.length - 1}`, imageColX + imgSize + 1, imgY + imgSize / 2);
            pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
            pdf.setFontSize(8);
          }
        } else {
          pdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
          pdf.text('-', imageColX, textStartY);
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        }
        xPos += colWidths.image;

        // Column 5: Locação (full text with word wrap)
        const locationLines = pdf.splitTextToSize(shot.location || '-', colWidths.location - 4);
        locationLines.forEach((line: string, i: number) => {
          pdf.text(line, xPos, textStartY + (i * lineHeight));
        });

        // Column 6: Status (only in record mode)
        if (mode === 'record') {
          xPos += colWidths.location;
          // Draw checkbox
          const checkX = xPos + 3;
          const checkY = currentY + 3;
          pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          pdf.setLineWidth(0.3);
          pdf.rect(checkX, checkY, 4, 4);
          
          if (shot.isCompleted) {
            // Filled checkbox with checkmark
            pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            pdf.rect(checkX, checkY, 4, 4, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(6);
            pdf.text('✓', checkX + 0.8, checkY + 3.2);
          }
        }

        currentY += rowHeight;
      });

      // Add footer to last page
      addFooter(currentPage, totalPages);

      // Summary at the end
      if (mode === 'record') {
        const completedCount = shots.filter(s => s.isCompleted).length;
        const totalCount = shots.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        
        pdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        pdf.setFontSize(9);
        pdf.text(
          `Progresso: ${completedCount}/${totalCount} takes (${percentage}%)`, 
          pageWidth / 2, 
          pageHeight - 16, 
          { align: 'center' }
        );
      }

      // Generate filename
      const sanitizedTitle = scriptTitle
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúâêîôûãõàèìòùç]/gi, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      const filename = `${sanitizedTitle}-shotlist.pdf`;

      // Save PDF
      pdf.save(filename);

      toast({
        title: "PDF exportado!",
        description: `Arquivo "${filename}" salvo com sucesso`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível exportar a Shot List",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const buttonContent = iconOnly ? (
    <Button
      variant={variant}
      size="icon"
      onClick={handleExportClick}
      disabled={isGenerating}
      title="Exportar PDF"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
    </Button>
  ) : (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportClick}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );

  return (
    <>
      {buttonContent}

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Shot List</DialogTitle>
            <DialogDescription>
              Configure as opções de exportação do PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {hasImages && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="includeImages"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(checked === true)}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="includeImages" 
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Incluir imagens de referência
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Aumenta o tamanho do arquivo e o tempo de geração
                  </p>
                </div>
              </div>
            )}
            
            {!hasImages && (
              <p className="text-sm text-muted-foreground">
                Nenhuma imagem de referência encontrada nos takes.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={generatePDF} className="gap-2">
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
