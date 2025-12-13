import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, MoreVertical, Mail, Shield, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

interface Guest {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "collaborator";
  status: "active" | "pending";
  type: "member" | "invite";
}

const GuestsSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <div 
      className="flex items-center gap-4 p-4 border-b border-border"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      <Skeleton className="h-10 w-10 rounded-md" />
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24 mt-1" />
      </div>
    </div>
    <div className="p-4 max-w-2xl mx-auto space-y-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

const Guests = () => {
  const navigate = useNavigate();
  const { activeRole, isLoading: contextLoading } = useWorkspaceContext();
  const { 
    members, 
    invites, 
    removeMember, 
    cancelInvite, 
    isLoading: workspaceLoading,
    workspace 
  } = useWorkspace();
  
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; type: "member" | "invite" } | null>(null);
  
  const isLoading = contextLoading || workspaceLoading;
  
  // Verificar permissão (apenas owner/admin podem acessar)
  useEffect(() => {
    if (!isLoading && activeRole !== "owner" && activeRole !== "admin") {
      toast.error("Acesso não autorizado");
      navigate("/profile");
    }
  }, [isLoading, activeRole, navigate]);

  // Combinar membros + convites em lista unificada
  const allGuests: Guest[] = [
    ...members.map(m => ({
      id: m.id,
      name: m.username || undefined,
      email: `User ${m.user_id.slice(0, 8)}...`, // Fallback - não temos email do member
      role: (m.role === "owner" ? "admin" : m.role) as "admin" | "collaborator",
      status: "active" as const,
      type: "member" as const,
    })),
    ...invites.map(i => ({
      id: i.id,
      name: undefined,
      email: i.email,
      role: (i.role === "owner" ? "admin" : i.role) as "admin" | "collaborator",
      status: "pending" as const,
      type: "invite" as const,
    })),
  ];

  const handleRoleChange = async (guestId: string) => {
    toast.info("Funcionalidade em desenvolvimento");
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    
    let success = false;
    if (confirmRemove.type === "member") {
      success = await removeMember(confirmRemove.id);
    } else {
      success = await cancelInvite(confirmRemove.id);
    }
    
    if (success) {
      setConfirmRemove(null);
    }
  };

  const handleResendInvite = (guestId: string) => {
    toast.info("Funcionalidade em desenvolvimento");
  };

  const getInitials = (guest: Guest) => {
    if (guest.name) {
      return guest.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return guest.email[0].toUpperCase();
  };

  const guestToRemove = allGuests.find(g => g.id === confirmRemove?.id);
  const maxGuests = workspace?.max_guests || 3;

  if (isLoading) {
    return <GuestsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div 
        className="flex items-center gap-4 p-4 border-b border-border"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Gerenciar Convidados</h1>
          <p className="text-sm text-muted-foreground">
            {allGuests.length}/{maxGuests} convidados
          </p>
        </div>
      </div>

      {/* Lista de convidados */}
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {allGuests.map((guest) => (
          <div
            key={guest.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                {getInitials(guest)}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{guest.name || guest.email}</span>
                  {guest.status === "pending" ? (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600/50 text-xs">
                      Pendente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600/50 text-xs">
                      Ativo
                    </Badge>
                  )}
                </div>
                {guest.name && (
                  <p className="text-sm text-muted-foreground">{guest.email}</p>
                )}
                <Badge variant="secondary" className="mt-1 text-xs">
                  {guest.role === "admin" ? "Admin" : "Colaborador"}
                </Badge>
              </div>
            </div>

            {/* Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange(guest.id)}>
                  <Shield className="h-4 w-4 mr-2" />
                  {guest.role === "admin" ? "Tornar Colaborador" : "Tornar Admin"}
                </DropdownMenuItem>
                {guest.status === "pending" && (
                  <DropdownMenuItem onClick={() => handleResendInvite(guest.id)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar convite
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmRemove({ id: guest.id, type: guest.type })}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  {guest.type === "invite" ? "Cancelar convite" : "Remover acesso"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Estado vazio */}
        {allGuests.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Nenhum convidado adicionado ainda
            </p>
          </div>
        )}

        {/* Botão adicionar */}
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => toast.info("Funcionalidade de convite em desenvolvimento")}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Pessoa
        </Button>
      </div>

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRemove?.type === "invite" ? "Cancelar convite?" : "Remover convidado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {guestToRemove && (
                <>
                  <strong>{guestToRemove.name || guestToRemove.email}</strong> 
                  {confirmRemove?.type === "invite" 
                    ? " não receberá mais o convite."
                    : " perderá acesso ao workspace."}
                  {" "}Esta ação pode ser desfeita convidando novamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
            >
              {confirmRemove?.type === "invite" ? "Cancelar Convite" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Guests;
