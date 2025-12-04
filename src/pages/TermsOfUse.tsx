import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Termos de Uso</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold mt-4">1. Aceitação dos Termos</h3>
            <p className="text-muted-foreground">
              Ao acessar e usar este aplicativo, você concorda em estar vinculado a estes termos de uso.
            </p>

            <h3 className="text-lg font-semibold mt-4">2. Uso do Serviço</h3>
            <p className="text-muted-foreground">
              Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos.
            </p>

            <h3 className="text-lg font-semibold mt-4">3. Propriedade Intelectual</h3>
            <p className="text-muted-foreground">
              Todo o conteúdo do aplicativo é de propriedade exclusiva e protegido por leis de direitos autorais.
            </p>

            <h3 className="text-lg font-semibold mt-4">4. Limitação de Responsabilidade</h3>
            <p className="text-muted-foreground">
              O serviço é fornecido "como está" sem garantias de qualquer tipo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;
