import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle } from "lucide-react";

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  textColor: string;
  icon: typeof Shield;
};

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  if (!password) {
    return {
      score: 0,
      label: "Muito fraca",
      color: "bg-destructive",
      textColor: "text-destructive",
      icon: AlertCircle,
    };
  }

  // Comprimento
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Letras minúsculas
  if (/[a-z]/.test(password)) score++;

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) score++;

  // Números
  if (/\d/.test(password)) score++;

  // Símbolos especiais
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalizar score para 0-4
  const normalizedScore = Math.min(Math.floor(score / 1.5), 4);

  const strengthLevels: PasswordStrength[] = [
    {
      score: 0,
      label: "Muito fraca",
      color: "bg-destructive",
      textColor: "text-destructive",
      icon: AlertCircle,
    },
    {
      score: 1,
      label: "Fraca",
      color: "bg-orange-500",
      textColor: "text-orange-500",
      icon: AlertCircle,
    },
    {
      score: 2,
      label: "Média",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      icon: Shield,
    },
    {
      score: 3,
      label: "Forte",
      color: "bg-green-500",
      textColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      score: 4,
      label: "Muito forte",
      color: "bg-green-600",
      textColor: "text-green-700",
      icon: CheckCircle,
    },
  ];

  return strengthLevels[normalizedScore];
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordStrength = calculatePasswordStrength(password);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Verifica se há uma sessão de recuperação válida
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Link inválido ou expirado",
          description: "Por favor, solicite um novo link de recuperação de senha.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/auth"), 2000);
      }
      
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação com zod
    const validation = passwordSchema.safeParse({ password, confirmPassword });

    if (!validation.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      validation.error.errors.forEach((error) => {
        const field = error.path[0] as "password" | "confirmPassword";
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Redirecionando...",
      });

      // Limpar campos
      setPassword("");
      setConfirmPassword("");

      // Redirecionar para home após 2 segundos
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="animate-pulse text-xl text-foreground">Verificando...</div>
      </div>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Redefinir senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  className={errors.password ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={`flex items-center gap-1 font-medium ${passwordStrength.textColor}`}>
                      <passwordStrength.icon size={14} />
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <span className={password.length >= 8 ? "text-green-600" : ""}>
                        {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                        {/[A-Z]/.test(password) ? "✓" : "○"} Letra maiúscula
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                        {/[a-z]/.test(password) ? "✓" : "○"} Letra minúscula
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/\d/.test(password) ? "text-green-600" : ""}>
                        {/\d/.test(password) ? "✓" : "○"} Número
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>
                        {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Símbolo especial
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Voltar para o login
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            A senha deve ter entre 6 e 72 caracteres.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
