import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientLayout } from "./ClientLayout";
import { ClientScriptCard } from "@/components/client/ClientScriptCard";
import { CommentSheet } from "@/components/client/CommentSheet";
import { useClientScripts, ClientScript } from "@/core/hooks/useClientScripts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ClientHomePage = () => {
  const { pendingScripts, isLoading, refetch, getCurrentStage } = useClientScripts();
  const [commentScript, setCommentScript] = useState<ClientScript | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (script: ClientScript) => {
    setProcessingId(script.id);
    try {
      const stage = getCurrentStage(script);
      const newProgress = {
        ...(script.stage_progress || {}),
        [stage]: {
          ...(((script.stage_progress as any)?.[stage]) || {}),
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by_client: true,
        },
      };

      const { error } = await supabase
        .from("scripts")
        .update({
          client_approved_at: new Date().toISOString(),
          stage_progress: newProgress,
        })
        .eq("id", script.id);

      if (error) throw error;
      toast.success("Conteúdo enviado pro próximo passo! 🎬");
      await refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao aprovar conteúdo");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Para gravar</h2>
          <p className="text-sm text-muted-foreground">
            {pendingScripts.length === 0
              ? "Nada pendente por aqui."
              : `${pendingScripts.length} ${pendingScripts.length === 1 ? "conteúdo te aguarda" : "conteúdos te aguardam"}`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : pendingScripts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">Nenhum conteúdo te aguardando agora 🎬</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando o seu social media liberar algo, aparece aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingScripts.map((script) => (
              <ClientScriptCard
                key={script.id}
                script={script}
                currentStage={getCurrentStage(script)}
                onApprove={handleApprove}
                onRequestChanges={(s) => setCommentScript(s)}
                isProcessing={processingId === script.id}
              />
            ))}
          </div>
        )}
      </div>

      <CommentSheet
        script={commentScript}
        isOpen={!!commentScript}
        onClose={() => setCommentScript(null)}
        onSubmitted={refetch}
      />
    </ClientLayout>
  );
};

export default ClientHomePage;