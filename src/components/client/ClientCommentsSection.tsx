import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  resolved: boolean;
  created_at: string;
  user_id: string;
  author_name?: string;
}

interface ClientCommentsSectionProps {
  scriptId: string;
}

export const ClientCommentsSection = ({ scriptId }: ClientCommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("script_comments")
      .select("id, content, resolved, created_at, user_id")
      .eq("script_id", scriptId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }
    const list = (data || []) as Comment[];

    // Buscar nomes dos autores
    if (list.length > 0) {
      const ids = Array.from(new Set(list.map((c) => c.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", ids);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.username]));
      list.forEach((c) => {
        c.author_name = nameMap.get(c.user_id) || "Cliente";
      });
    }
    setComments(list);
    setIsLoading(false);
  }, [scriptId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleResolve = async (id: string, resolved: boolean) => {
    const { error } = await supabase
      .from("script_comments")
      .update({ resolved: !resolved })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    fetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("script_comments").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    fetch();
  };

  if (isLoading || comments.length === 0) return null;

  const pending = comments.filter((c) => !c.resolved);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Comentários do cliente</h3>
        </div>
        {pending.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pending.length} pendente{pending.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-lg border text-sm ${
              c.resolved
                ? "border-border/50 bg-muted/30 opacity-70"
                : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{c.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                  {c.resolved && (
                    <Badge variant="outline" className="text-[10px]">
                      Resolvido
                    </Badge>
                  )}
                </div>
                <p className={c.resolved ? "line-through" : ""}>{c.content}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleResolve(c.id, c.resolved)}
                  aria-label={c.resolved ? "Marcar como pendente" : "Marcar como resolvido"}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Excluir comentário"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};