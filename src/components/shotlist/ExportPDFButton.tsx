import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { ShotItem } from "./ShotListTable";
import muzzeLogo from "@/assets/muzze-logo.png";

interface ExportPDFButtonProps {
  shots: ShotItem[];
  scriptTitle: string;
  mode: 'review' | 'record';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  iconOnly?: boolean;
}

export function ExportPDFButton({ 
  shots, 
  scriptTitle, 
  mode, 
  variant = 'outline',
  size = 'default',
  iconOnly = false 
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    if (shots.length === 0) {
      toast({
        title: "Shot List vazia",
        description: "Adicione takes antes de exportar",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto preparamos o documento",
    });

    try {
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
        // Logo placeholder (will use text for now)
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.circle(margin + 6, 15, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('M', margin + 4.5, 17);

        // Title
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const title = scriptTitle.length > 40 ? scriptTitle.substring(0, 40) + '...' : scriptTitle;
        pdf.text(title, margin + 18, 17);

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

      // Table header setup
      const tableTop = 35;
      const rowHeight = mode === 'record' ? 18 : 16;
      const colWidths = mode === 'record' 
        ? { num: 10, text: 75, scene: 45, location: 35, status: 15 }
        : { num: 10, text: 85, scene: 50, location: 35 };

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
        pdf.text('Fala / Texto', xPos, y + 5.5);
        xPos += colWidths.text;
        pdf.text('Cena', xPos, y + 5.5);
        xPos += colWidths.scene;
        pdf.text('Locação', xPos, y + 5.5);
        if (mode === 'record') {
          xPos += colWidths.location;
          pdf.text('Status', xPos, y + 5.5);
        }
        
        return y + 10;
      };

      // Calculate total pages needed
      const availableHeight = pageHeight - tableTop - 25; // Header and footer space
      const rowsPerPage = Math.floor(availableHeight / rowHeight);
      const totalPages = Math.ceil(shots.length / rowsPerPage);

      let currentPage = 1;
      let currentY = tableTop;

      // Add first page header and table header
      addHeader(currentPage, totalPages);
      currentY = addTableHeader(currentY);

      // Render shots
      shots.forEach((shot, index) => {
        // Check if need new page
        if (currentY + rowHeight > pageHeight - 20) {
          addFooter(currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          addHeader(currentPage, totalPages);
          currentY = addTableHeader(tableTop);
        }

        // Alternate row background
        if (index % 2 === 1) {
          pdf.setFillColor(alternateRowColor[0], alternateRowColor[1], alternateRowColor[2]);
          pdf.rect(margin, currentY, contentWidth, rowHeight - 2, 'F');
        }

        // Row border
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(0.1);
        pdf.line(margin, currentY + rowHeight - 2, pageWidth - margin, currentY + rowHeight - 2);

        // Row content
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        let xPos = margin + 2;
        
        // Number
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(index + 1), xPos, currentY + 5);
        pdf.setFont('helvetica', 'normal');
        xPos += colWidths.num;

        // Script segment (truncate if too long)
        const maxTextLength = mode === 'record' ? 90 : 100;
        const text = shot.scriptSegment.length > maxTextLength 
          ? shot.scriptSegment.substring(0, maxTextLength) + '...'
          : shot.scriptSegment;
        
        // Word wrap for text column
        const textLines = pdf.splitTextToSize(text, colWidths.text - 4);
        pdf.text(textLines.slice(0, 2), xPos, currentY + 5);
        xPos += colWidths.text;

        // Scene
        const scene = (shot.scene || '-').substring(0, 30);
        pdf.text(scene, xPos, currentY + 5);
        xPos += colWidths.scene;

        // Location
        const location = (shot.location || '-').substring(0, 20);
        pdf.text(location, xPos, currentY + 5);

        // Status (only in record mode)
        if (mode === 'record') {
          xPos += colWidths.location;
          // Draw checkbox
          const checkX = xPos + 3;
          const checkY = currentY + 2;
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

  if (iconOnly) {
    return (
      <Button
        variant={variant}
        size="icon"
        onClick={generatePDF}
        disabled={isGenerating}
        title="Exportar PDF"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generatePDF}
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
}
