import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, MoreVertical, Mail, Shield, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Guest {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "collaborator";
  status: "active" | "pending";
}

const Guests = () => {
  const navigate = useNavigate();

  // Dados mockados - não depende de backend
  const initialGuests: Guest[] = [
    { id: "1", name: "Maria Silva", email: "maria@email.com", role: "admin", status: "active" },
    { id: "2", name: "João Santos", email: "joao@email.com", role: "collaborator", status: "active" },
    { id: "3", email: "pendente@email.com", role: "collaborator", status: "pending" },
  ];

  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleRoleChange = (guestId: string) => {
    setGuests(prev => prev.map(g =>
      g.id === guestId
        ? { ...g, role: g.role === "admin" ? "collaborator" : "admin" }
        : g
    ));
    toast.success("Papel alterado com sucesso");
  };

  const handleRemove = (guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
    toast.success("Convidado removido");
    setConfirmRemove(null);
  };

  const handleResendInvite = (guestId: string) => {
    toast.success("Convite reenviado!");
  };

  const getInitials = (guest: Guest) => {
    if (guest.name) {
      return guest.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return guest.email[0].toUpperCase();
  };

  const guestToRemove = guests.find(g => g.id === confirmRemove);

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
            {guests.length}/3 convidados
          </p>
        </div>
      </div>

      {/* Lista de convidados */}
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {guests.map((guest) => (
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
                  onClick={() => setConfirmRemove(guest.id)}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remover acesso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Estado vazio */}
        {guests.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Nenhum convidado adicionado ainda
            </p>
          </div>
        )}

        {/* Botão adicionar */}
        <Button variant="outline" className="w-full mt-4">
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Pessoa
        </Button>
      </div>

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover convidado?</AlertDialogTitle>
            <AlertDialogDescription>
              {guestToRemove && (
                <>
                  <strong>{guestToRemove.name || guestToRemove.email}</strong> perderá acesso ao workspace.
                  Esta ação pode ser desfeita convidando novamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Guests;
