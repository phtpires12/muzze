import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, UserPlus, MoreVertical, Mail, Shield, UserMinus, 
  Clock, AlertTriangle, Send, X, RefreshCw, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { Paywall, PaywallAction } from "@/components/Paywall";
import { StagePermissions, WorkspaceInvite, CreativeStage } from "@/types/workspace";
import { MemberPermissionsModal } from "@/components/workspace/MemberPermissionsModal";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActiveMember {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "collaborator";
  userId: string;
  allowedTimerStages: CreativeStage[];
  canEditStages: CreativeStage[];
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
  const planCapabilities = usePlanCapabilitiesOptional();
  const { 
    members, 
    invites, 
    removeMember, 
    cancelInvite,
    resendInvite,
    inviteMember,
    updateMemberPermissions,
    isLoading: workspaceLoading,
    workspace 
  } = useWorkspace();
  
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; type: "member" | "invite"; name: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "collaborator">("collaborator");
  const [isInviting, setIsInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<ActiveMember | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('invite_user');
  
  const isLoading = contextLoading || workspaceLoading;
  
  // Plan-based limits
  const maxGuests = planCapabilities?.limits.maxGuests ?? workspace?.max_guests ?? 3;
  const canInviteUsers = planCapabilities?.limits.canInviteUsers ?? true;
  const totalGuests = members.length + invites.length;

  // Handler for invite button click - check plan limits first
  const handleInviteClick = () => {
    // Check if plan allows inviting users
    if (!canInviteUsers) {
      setPaywallAction('invite_user');
      setShowPaywall(true);
      return;
    }
    
    // Check guest limit
    if (totalGuests >= maxGuests) {
      setPaywallAction('invite_guest_limit');
      setShowPaywall(true);
      return;
    }
    
    setShowInviteModal(true);
  };
  
  // Verificar permissão (apenas owner/admin podem acessar)
  useEffect(() => {
    if (!isLoading && activeRole !== "owner" && activeRole !== "admin") {
      toast.error("Acesso não autorizado");
      navigate("/profile");
    }
  }, [isLoading, activeRole, navigate]);

  // Membros ativos (já aceitaram o convite)
  const activeMembers: ActiveMember[] = members.map(m => ({
    id: m.id,
    name: m.username || undefined,
    email: m.email || `user_${m.user_id.slice(0, 8)}@...`,
    role: (m.role === "owner" ? "admin" : m.role) as "admin" | "collaborator",
    userId: m.user_id,
    allowedTimerStages: (m.allowed_timer_stages || []) as CreativeStage[],
    canEditStages: (m.can_edit_stages || []) as CreativeStage[],
  }));

  const handleRoleChange = async (memberId: string) => {
    toast.info("Funcionalidade em desenvolvimento");
  };

  const handleSavePermissions = async (permissions: StagePermissions) => {
    if (!editingMember) return;
    await updateMemberPermissions(editingMember.id, permissions);
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

  const handleResendInvite = async (inviteId: string) => {
    setResendingId(inviteId);
    await resendInvite(inviteId);
    setResendingId(null);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Digite um email");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }
    
    setIsInviting(true);
    
    // Para MVP: dar acesso total a todas as etapas
    const permissions: StagePermissions = {
      allowed_timer_stages: ['ideation', 'script', 'review', 'recording', 'editing'],
      can_edit_stages: ['ideation', 'script', 'review', 'recording', 'editing'],
    };
    
    const success = await inviteMember(email, inviteRole, permissions);
    
    if (success) {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("collaborator");
    }
    
    setIsInviting(false);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "?";
  };

  const getInviteStatus = (invite: WorkspaceInvite) => {
    const expiresAt = new Date(invite.expires_at);
    const now = new Date();
    const hoursRemaining = differenceInHours(expiresAt, now);
    const daysRemaining = differenceInDays(expiresAt, now);
    
    if (hoursRemaining < 24) {
      return { 
        label: "Expirando", 
        variant: "warning" as const, 
        icon: AlertTriangle,
        detail: `${hoursRemaining}h restantes`
      };
    }
    
    return { 
      label: "Aguardando", 
      variant: "pending" as const, 
      icon: Clock,
      detail: `${daysRemaining} dias restantes`
    };
  };

  const maxGuests = workspace?.max_guests || 3;
  const totalGuests = activeMembers.length + invites.length;

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
            {totalGuests}/{maxGuests} convidados
          </p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        
        {/* Seção: Membros Ativos */}
        {activeMembers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Membros Ativos ({activeMembers.length})
              </h2>
            </div>
            
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/60 to-green-600 flex items-center justify-center text-white font-medium text-sm">
                    {getInitials(member.name, member.email)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name || member.email}</span>
                      <Badge variant="outline" className="text-green-600 border-green-600/50 text-xs">
                        Ativo
                      </Badge>
                    </div>
                    {member.name && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {member.role === "admin" ? "Admin" : "Colaborador"}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingMember(member)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Gerenciar Permissões
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(member.id)}>
                      <Users className="h-4 w-4 mr-2" />
                      {member.role === "admin" ? "Tornar Colaborador" : "Tornar Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setConfirmRemove({ id: member.id, type: "member", name: member.name || member.email })}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remover acesso
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Seção: Convites Pendentes */}
        {invites.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Convites Pendentes ({invites.length})
              </h2>
            </div>
            
            {invites.map((invite) => {
              const status = getInviteStatus(invite);
              const StatusIcon = status.icon;
              const isResending = resendingId === invite.id;
              
              return (
                <div
                  key={invite.id}
                  className="p-4 rounded-lg border-2 border-dashed border-border/70 bg-card/50 opacity-80 space-y-3"
                >
                  {/* Header do convite */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/40 to-orange-500/40 border-2 border-dashed border-yellow-500/50 flex items-center justify-center text-yellow-600 font-medium text-sm">
                        {getInitials(undefined, invite.email)}
                      </div>
                      <div>
                        <span className="font-medium">{invite.email}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              status.variant === "warning" 
                                ? "text-orange-600 border-orange-600/50 bg-orange-500/10" 
                                : "text-yellow-600 border-yellow-600/50 bg-yellow-500/10"
                            }`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {invite.role === "admin" ? "Admin" : "Colaborador"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do convite */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pl-[52px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Enviado em {format(new Date(invite.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Expira em {format(new Date(invite.expires_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pl-[52px]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleResendInvite(invite.id)}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 mr-1.5" />
                      )}
                      {isResending ? "Enviando..." : "Reenviar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-destructive hover:text-destructive"
                      onClick={() => setConfirmRemove({ id: invite.id, type: "invite", name: invite.email })}
                    >
                      <X className="h-3 w-3 mr-1.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado vazio */}
        {activeMembers.length === 0 && invites.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Nenhum convidado adicionado ainda
            </p>
          </div>
        )}

        {/* Limite atingido */}
        {totalGuests >= maxGuests && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Limite de {maxGuests} convidados atingido
          </p>
        )}

        {/* Botão adicionar - always show, but use plan-aware handler */}
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={handleInviteClick}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Pessoa
          {!canInviteUsers && <span className="ml-2 text-xs text-muted-foreground">(Pro)</span>}
        </Button>
      </div>

      {/* Paywall */}
      <Paywall
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        action={paywallAction}
        currentUsage={totalGuests}
        limit={maxGuests}
        context="guests_page"
      />

      {/* Modal de convite */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Pessoa</DialogTitle>
            <DialogDescription>
              Envie um convite para alguém colaborar no seu workspace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="pessoa@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Papel</Label>
              <RadioGroup 
                value={inviteRole} 
                onValueChange={(v) => setInviteRole(v as "admin" | "collaborator")}
                className="space-y-2"
              >
                <div className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="collaborator" id="collaborator" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="collaborator" className="font-medium cursor-pointer">
                      Colaborador
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Pode criar e editar conteúdo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="admin" id="admin" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="admin" className="font-medium cursor-pointer">
                      Admin
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Acesso total, pode gerenciar membros
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInviteModal(false)} disabled={isInviting}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRemove?.type === "invite" ? "Cancelar convite?" : "Remover convidado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove && (
                <>
                  <strong>{confirmRemove.name}</strong> 
                  {confirmRemove.type === "invite" 
                    ? " não receberá mais o convite."
                    : " perderá acesso ao workspace."}
                  {" "}Esta ação pode ser desfeita convidando novamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
            >
              {confirmRemove?.type === "invite" ? "Cancelar Convite" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Permissões */}
      <MemberPermissionsModal
        member={editingMember}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSavePermissions}
      />
    </div>
  );
};

export default Guests;
