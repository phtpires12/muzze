import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/routes/routes";
import { Button } from "@/components/ui/button";

export default function NotionCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            setStatus('error');
            setErrorMsg(`O Notion recusou a conexão: ${error}`);
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg("Nenhum código de autorização recebido do Notion.");
            return;
        }

        const exchangeCodeForToken = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    throw new Error("Você precisa estar logado no Muzze para conectar o Notion.");
                }

                const { data: proxyData, error: proxyError } = await supabase.functions.invoke('notion-proxy', {
                    body: {
                        action: 'oauth',
                        code,
                        redirect_uri: window.location.origin + ROUTES.AUTH_NOTION_CALLBACK
                    }
                });

                if (proxyError) {
                    throw new Error(proxyError.message || "Erro na comunicação com o backend seguro do Notion");
                }

                if (!proxyData || !proxyData.success) {
                    throw new Error(proxyData?.error || "Erro ao validar o código no Notion. Verifique suas chaves.");
                }

                // Salvar token no banco
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        notion_access_token: proxyData.access_token,
                        notion_workspace_id: proxyData.workspace_id
                    })
                    .eq('user_id', session.user.id);

                if (updateError) throw updateError;

                setStatus('success');
                setTimeout(() => {
                    navigate(ROUTES.CALENDARIO, { replace: true });
                }, 2000);

            } catch (err: any) {
                console.error("Erro na integracao do auth:", err);
                setStatus('error');
                setErrorMsg(err.message || "Não foi possível concluir a integração com o Notion. Tente novamente.");
            }
        };

        const timeoutId = setTimeout(exchangeCodeForToken, 500);
        return () => clearTimeout(timeoutId);
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
            <div className="max-w-md w-full p-8 rounded-xl border border-border bg-card shadow-sm text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold">Conectando ao Notion...</h2>
                        <p className="text-muted-foreground text-sm">
                            Estamos finalizando a conexão com o seu espaço de trabalho. Por favor, aguarde e não feche esta página.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-emerald-500">Notion Conectado!</h2>
                        <p className="text-muted-foreground text-sm">
                            Integração realizada com sucesso. Você será redirecionado automaticamente...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-destructive">Falha na Conexão</h2>
                        <p className="text-muted-foreground text-sm mb-4">
                            {errorMsg}
                        </p>
                        <Button onClick={() => navigate(ROUTES.CALENDARIO)} variant="outline" className="w-full">
                            Voltar ao Calendário
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
