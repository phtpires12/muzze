import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { WorkspaceRole, CREATIVE_STAGES, CreativeStage } from '@/types/workspace';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MoreVertical, UserPlus, Mail, Trash2, RefreshCw, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

const Guests = () => {
  const navigate = useNavigate();
  const { activeWorkspace, activeRole, isLoading: workspaceLoading } = useWorkspaceContext();
  const { members, invites, inviteMember, removeMember, cancelInvite, isOwner, refetch } = useWorkspace();
  
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('collaborator');
  const [selectedTimerStages, setSelectedTimerStages] = useState<CreativeStage[]>([]);
  const [selectedEditStages, setSelectedEditStages] = useState<CreativeStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Authorization check
  useEffect(() => {
    if (!workspaceLoading && activeRole !== "owner" && activeRole !== "admin") {
      toast.error("Acesso não autorizado");
      navigate("/profile");
    }
  }, [workspaceLoading, activeRole, navigate]);

  const totalGuests = members.length + invites.length;
  const maxGuests = activeWorkspace?.max_guests || 3;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    setIsLoading(true);
    const success = await inviteMember(inviteEmail, inviteRole, {
      allowed_timer_stages: selectedTimerStages,
      can_edit_stages: selectedEditStages,
    });

    if (success) {
      setInviteEmail('');
      setInviteRole('collaborator');
      setSelectedTimerStages([]);
      setSelectedEditStages([]);
      setIsInviteFormOpen(false);
    }
    setIsLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
    setConfirmRemove(null);
  };

  const handleCancelInvite = async (inviteId: string) => {
    await cancelInvite(inviteId);
  };

  const handleResendInvite = async (inviteId: string, email: string) => {
    await cancelInvite(inviteId);
    await inviteMember(email, 'collaborator', {
      allowed_timer_stages: [],
      can_edit_stages: [],
    });
    toast.success('Convite reenviado');
  };

  const toggleStage = (stage: CreativeStage, list: CreativeStage[], setList: (stages: CreativeStage[]) => void) => {
    if (list.includes(stage)) {
      setList(list.filter(s => s !== stage));
    } else {
      setList([...list, stage]);
    }
  };

  // Loading state
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="flex items-center gap-4 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // If not authorized, don't render (useEffect will redirect)
  if (activeRole !== "owner" && activeRole !== "admin") {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div 
          className="flex items-center gap-4 p-4 border-b"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Convidados do Workspace</h1>
            <p className="text-sm text-muted-foreground">
              {activeWorkspace?.name} • {totalGuests}/{maxGuests} convidados
            </p>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          {/* Guest List */}
          <div className="space-y-3">
            {/* Active Members */}
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {(member.username || member.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.username || member.email || 'Usuário'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                        Ativo
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {member.role === 'admin' ? 'Admin' : 'Colaborador'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setConfirmRemove(member.id)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

            {/* Pending Invites */}
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-600 text-sm">
                      <Mail className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{invite.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                        Pendente
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {invite.role === 'admin' ? 'Admin' : 'Colaborador'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleResendInvite(invite.id, invite.email)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reenviar convite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCancelInvite(invite.id)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                        Cancelar convite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

            {totalGuests === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum convidado ainda</p>
              </div>
            )}
          </div>

          {/* Invite Form */}
          {isInviteFormOpen ? (
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Email do convidado</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <div className="flex gap-2">
                  <Button
                    variant={inviteRole === 'collaborator' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInviteRole('collaborator')}
                  >
                    Colaborador
                  </Button>
                  <Button
                    variant={inviteRole === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInviteRole('admin')}
                  >
                    Admin
                  </Button>
                </div>
              </div>

              {inviteRole === 'collaborator' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Pode usar timer em:</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(CREATIVE_STAGES).map((stage) => (
                        <div key={stage.key} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`timer-${stage.key}`}
                            checked={selectedTimerStages.includes(stage.key)}
                            onCheckedChange={() => toggleStage(stage.key, selectedTimerStages, setSelectedTimerStages)}
                          />
                          <label htmlFor={`timer-${stage.key}`} className="text-xs">
                            {stage.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Pode editar em:</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(CREATIVE_STAGES).map((stage) => (
                        <div key={stage.key} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`edit-${stage.key}`}
                            checked={selectedEditStages.includes(stage.key)}
                            onCheckedChange={() => toggleStage(stage.key, selectedEditStages, setSelectedEditStages)}
                          />
                          <label htmlFor={`edit-${stage.key}`} className="text-xs">
                            {stage.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsInviteFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleInvite}
                  disabled={isLoading || !inviteEmail.trim()}
                >
                  {isLoading ? 'Enviando...' : 'Enviar convite'}
                </Button>
              </div>
            </div>
          ) : (
            isOwner && totalGuests < maxGuests && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsInviteFormOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Pessoa
              </Button>
            )
          )}

          {isOwner && totalGuests >= maxGuests && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Limite de {maxGuests} convidados atingido
            </p>
          )}
        </div>
      </div>

      {/* Confirm Remove Dialog */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover convidado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa perderá acesso ao workspace imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmRemove && handleRemoveMember(confirmRemove)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Guests;
