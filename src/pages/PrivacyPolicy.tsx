import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Política de Privacidade</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Nossa Política de Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold mt-4">1. Informações que Coletamos</h3>
            <p className="text-muted-foreground">
              Coletamos informações que você nos fornece diretamente, como nome, e-mail e conteúdo criado no aplicativo.
            </p>

            <h3 className="text-lg font-semibold mt-4">2. Como Usamos suas Informações</h3>
            <p className="text-muted-foreground">
              Usamos suas informações para fornecer, manter e melhorar nossos serviços.
            </p>

            <h3 className="text-lg font-semibold mt-4">3. Compartilhamento de Informações</h3>
            <p className="text-muted-foreground">
              Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para fornecer o serviço.
            </p>

            <h3 className="text-lg font-semibold mt-4">4. Segurança</h3>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança para proteger suas informações pessoais.
            </p>

            <h3 className="text-lg font-semibold mt-4">5. Seus Direitos</h3>
            <p className="text-muted-foreground">
              Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
