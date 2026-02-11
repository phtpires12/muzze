import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { logError } from "@/lib/error-logger";

import { motion } from "framer-motion";

const signupSchema = z.object({
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
    'Database error saving new user': 'Erro temporário ao criar sua conta. Por favor, tente novamente em alguns segundos.',
    'Database error creating new user': 'Erro temporário ao criar sua conta. Por favor, tente novamente em alguns segundos.',
  };
  const exactMatch = errorMap[error];
  if (exactMatch) return exactMatch;
  if (error?.toLowerCase().includes('database error')) {
    return 'Erro temporário ao criar sua conta. Por favor, tente novamente em alguns segundos.';
  }
  return error || 'Ocorreu um erro. Tente novamente.';
};

interface Screen21SignupProps {
  onSuccess: () => void;
  onBack: () => void;
  showDevSkip?: boolean;
  onDevSkip?: () => void;
}

export const Screen21Signup = ({ onSuccess, onBack, showDevSkip, onDevSkip }: Screen21SignupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const signupWithRetry = async (retries = 1): Promise<{ data: any; error: any }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error && error.message?.toLowerCase().includes('database error') && retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return signupWithRetry(retries - 1);
      }
      return { data, error };
    };

    try {
      const { error } = await signupWithRetry();
      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Bem-vindo à Muzze.",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Signup error:", error);
      logError("signup_failed", {
        message: error.message,
        stack: error.stack,
        context: { email, source: 'Screen21Signup' },
      });
      toast({
        title: "Erro ao criar conta",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      {/* Header with back + progress */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={onBack} className="p-1 -ml-1 text-foreground/70 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2 mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
          <p className="text-muted-foreground text-sm">
            Você está a poucos passos de transformar sua consistência criativa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <SocialLoginButtons showSeparator separatorText="ou continue com email" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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

            <p className="text-xs text-center text-muted-foreground">
              Ao criar sua conta, você concorda com nossos{" "}
              <a href="/terms" className="underline">Termos de Uso</a>{" "}e{" "}
              <a href="/privacy" className="underline">Política de Privacidade</a>.
            </p>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/auth")}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Já tem uma conta? <span className="underline font-medium">Entrar</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-violet-50 via-violet-50 to-violet-50/0 dark:from-background dark:via-background dark:to-background/0">
        <Button
          type="submit"
          variant="gradient-pill"
          size="lg"
          className="w-full"
          disabled={loading || !email || !password}
          onClick={handleSignup}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar minha conta"
          )}
        </Button>
      </div>
    </div>
  );
};
