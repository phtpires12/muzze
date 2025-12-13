import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import muzzeLogoWhite from "@/assets/muzze-logo-white.png";

interface InviteData {
  id: string;
  email: string;
  role: string;
  workspace_id: string;
  invited_by: string;
  expires_at: string;
  allowed_timer_stages: string[];
  can_edit_stages: string[];
  workspaces: {
    name: string;
    owner_id: string;
  };
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteId = searchParams.get("id");

  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "accepted" | "error" | "wrong_email">("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkInvite();
  }, [inviteId]);

  const checkInvite = async () => {
    if (!inviteId) {
      setStatus("error");
      return;
    }

    try {
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch invite details
      const { data: inviteData, error } = await supabase
        .from("workspace_invites")
        .select(`
          *,
          workspaces (name, owner_id)
        `)
        .eq("id", inviteId)
        .single();

      if (error || !inviteData) {
        console.error("Invite not found:", error);
        setStatus("error");
        return;
      }

      setInvite(inviteData as InviteData);

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      // Check if user is logged in with the correct email
      if (currentUser) {
        if (currentUser.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
          setStatus("wrong_email");
          return;
        }
      }

      setStatus("valid");
    } catch (err) {
      console.error("Error checking invite:", err);
      setStatus("error");
    }
  };

  const handleAcceptInvite = async () => {
    if (!invite || !user) return;

    setIsAccepting(true);

    try {
      // Insert into workspace_members
      const { error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role as "admin" | "collaborator",
          invited_by: invite.invited_by,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          allowed_timer_stages: invite.allowed_timer_stages,
          can_edit_stages: invite.can_edit_stages,
        });

      if (insertError) {
        console.error("Error accepting invite:", insertError);
        toast.error("Erro ao aceitar convite");
        setIsAccepting(false);
        return;
      }

      // Delete the invite
      await supabase
        .from("workspace_invites")
        .delete()
        .eq("id", invite.id);

      setStatus("accepted");
      toast.success("Convite aceito com sucesso!");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Error accepting invite:", err);
      toast.error("Erro ao aceitar convite");
      setIsAccepting(false);
    }
  };

  const handleLogin = () => {
    // Store invite ID to continue after login
    localStorage.setItem("pendingInviteId", inviteId || "");
    navigate("/auth");
  };

  const handleSignup = () => {
    // Store invite ID to continue after signup
    localStorage.setItem("pendingInviteId", inviteId || "");
    navigate("/onboarding");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStatus("valid");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 via-purple-500 to-violet-600 p-6 rounded-t-lg">
          <div className="flex items-center justify-center gap-3">
            <img src={muzzeLogoWhite} alt="Muzze" className="h-8" />
          </div>
        </div>

        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <CardTitle className="mt-4">Verificando convite...</CardTitle>
            </>
          )}

          {status === "valid" && invite && (
            <>
              <Users className="h-12 w-12 mx-auto text-primary" />
              <CardTitle className="mt-4">Convite para Colaborar</CardTitle>
              <CardDescription className="text-base mt-2">
                Você foi convidado para o workspace <strong>"{invite.workspaces.name}"</strong> como{" "}
                <strong>{invite.role === "admin" ? "Administrador" : "Colaborador"}</strong>
              </CardDescription>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <CardTitle className="mt-4">Convite Expirado</CardTitle>
              <CardDescription>
                Este convite expirou. Peça para o administrador enviar um novo convite.
              </CardDescription>
            </>
          )}

          {status === "accepted" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <CardTitle className="mt-4">Convite Aceito!</CardTitle>
              <CardDescription>
                Você agora faz parte do workspace. Redirecionando...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <CardTitle className="mt-4">Convite Inválido</CardTitle>
              <CardDescription>
                Este convite não existe ou já foi utilizado.
              </CardDescription>
            </>
          )}

          {status === "wrong_email" && invite && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-amber-500" />
              <CardTitle className="mt-4">Email Diferente</CardTitle>
              <CardDescription>
                Este convite foi enviado para <strong>{invite.email}</strong>, 
                mas você está logado como <strong>{user?.email}</strong>.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "valid" && !user && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Para aceitar o convite, faça login ou crie uma conta com o email <strong>{invite?.email}</strong>
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleLogin} className="w-full">
                  Fazer Login
                </Button>
                <Button onClick={handleSignup} variant="outline" className="w-full">
                  Criar Conta
                </Button>
              </div>
            </>
          )}

          {status === "valid" && user && (
            <Button 
              onClick={handleAcceptInvite} 
              className="w-full"
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aceitando...
                </>
              ) : (
                "Aceitar Convite"
              )}
            </Button>
          )}

          {status === "wrong_email" && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleLogout} variant="outline" className="w-full">
                Sair e entrar com outro email
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
                Voltar para o início
              </Button>
            </div>
          )}

          {(status === "expired" || status === "error") && (
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Voltar para o início
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
