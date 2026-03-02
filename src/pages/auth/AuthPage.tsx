import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/core/hooks';
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import muzzeLeaf from "@/assets/muzze-leaf-gradient.png";
import { SocialLoginButtons } from "@/components/content/auth/SocialLoginButtons";
import { motion } from "framer-motion";
import { ROUTES } from "@/routes/routes";


const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const translateAuthError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': 'Este email já está cadastrado. Tente fazer login.',
    'Invalid login credentials': 'Email ou senha incorretos.',
    'Email not confirmed': 'Por favor, confirme seu email antes de entrar.',
    'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
    'Signup requires a valid password': 'A senha deve ter no mínimo 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de email inválido.',
  };
  return errorMap[error] || error || 'Ocorreu um erro. Tente novamente.';
};

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_login')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile && profile.first_login === false) {
          const pendingInviteId = localStorage.getItem("pendingInviteId");
          if (pendingInviteId) {
            localStorage.removeItem("pendingInviteId");
            navigate(`/invite?id=${pendingInviteId}`);
          } else {
            navigate(ROUTES.HOME);
          }
        } else {
          await supabase.auth.signOut();
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      const pendingInviteId = localStorage.getItem("pendingInviteId");
      if (pendingInviteId) {
        localStorage.removeItem("pendingInviteId");
        navigate(`/invite?id=${pendingInviteId}`);
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <img src={muzzeLeaf} alt="Muzze" className="w-14 h-14 object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-2 mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
            <p className="text-muted-foreground text-sm">
              Digite seu email para receber o link de recuperação.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setShowResetPassword(false); setResetEmail(""); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar para o login
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-violet-50 via-violet-50 to-violet-50/0 dark:from-background dark:via-background dark:to-background/0">
          <Button
            variant="gradient-pill"
            size="lg"
            className="w-full"
            disabled={loading || !resetEmail}
            onClick={handleResetPassword}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <img src={muzzeLeaf} alt="Muzze" className="w-14 h-14 object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2 mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm">
            Continue sua jornada de constância criativa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <SocialLoginButtons showSeparator separatorText="ou entre com email" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Ao continuar, você concorda com os Termos e a Magia da Constância ✨
            </p>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ONBOARDING)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Não tem uma conta? <span className="underline font-medium">Criar conta</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-violet-50 via-violet-50 to-violet-50/0 dark:from-background dark:via-background dark:to-background/0">
        <Button
          variant="gradient-pill"
          size="lg"
          className="w-full"
          disabled={loading || !email || !password}
          onClick={handleLogin}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Carregando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Auth;
