import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SendSuggestions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState("");

  const handleSubmit = () => {
    if (!suggestion.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva sua sugestão",
        variant: "destructive",
      });
      return;
    }

    // Handle submission logic here
    toast({
      title: "Sugestão enviada!",
      description: "Obrigado pelo seu feedback.",
    });
    setSuggestion("");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Mandar Sugestões</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Sua opinião é importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Compartilhe suas ideias, sugestões ou feedback..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={8}
            />
            <Button onClick={handleSubmit} className="w-full">
              Enviar Sugestão
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendSuggestions;
