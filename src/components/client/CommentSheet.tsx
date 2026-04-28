import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientScript } from "@/core/hooks/useClientScripts";

interface CommentSheetProps {
  script: ClientScript | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const CommentSheet = ({ script, isOpen, onClose, onSubmitted }: CommentSheetProps) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setContent("");
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!script || !content.trim()) {
      toast.error("Escreva o que precisa ser ajustado");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { error } = await supabase.from("script_comments").insert({
        script_id: script.id,
        workspace_id: script.workspace_id,
        user_id: userData.user.id,
        content: content.trim(),
      });
      if (error) throw error;
      toast.success("Pedido de ajuste enviado!");
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Pedir ajuste</SheetTitle>
          <SheetDescription>
            Conta o que precisa ser mudado em <strong>{script?.title}</strong>. O social media vai receber o seu pedido.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Textarea
            placeholder="Ex: O gancho ficou longo, podemos cortar a primeira frase..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            disabled={submitting}
            autoFocus
          />
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
            {submitting ? "Enviando..." : "Enviar pedido"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};