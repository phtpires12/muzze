import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { AvatarCropEditor } from "@/components/AvatarCropEditor";

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
      if (profile?.username) {
        setName(profile.username);
      }
      setInitializing(false);
    };
    fetchUserData();
  }, [profile]);

  const handleAvatarSave = async (blob: Blob) => {
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileName = `${user.id}/avatar.png`;
      
      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([fileName]);
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { 
          contentType: "image/png",
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with avatar URL (add timestamp to bust cache)
      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi salva com sucesso."
      });
      
      setShowCropEditor(false);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao salvar foto",
        description: error.message || "Não foi possível salvar sua foto.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ username: name.trim() });
      
      toast({
        title: "Perfil atualizado",
        description: "Seu nome foi salvo com sucesso."
      });
      
      navigate("/profile");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/profile")}
              className="rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border border-border rounded-xl bg-background">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-2">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-border">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile?.username || "Avatar"} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button 
                  size="icon" 
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background border-border hover:bg-muted"
                  onClick={() => setShowCropEditor(true)}
                  disabled={uploadingAvatar}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Toque para alterar a foto
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-lg border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="h-11 rounded-lg bg-muted/50 border-border cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado.
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              className="w-full h-11 rounded-lg font-medium"
              disabled={loading || initializing || !name.trim()}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCropEditor} onOpenChange={setShowCropEditor}>
        <AvatarCropEditor 
          onSave={handleAvatarSave}
          onCancel={() => setShowCropEditor(false)}
        />
      </Dialog>
    </div>
  );
};

export default EditProfile;
