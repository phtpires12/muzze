import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyProgress = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Roteiros criados", value: 24, icon: FileText },
    { label: "Shots completos", value: 156, icon: CheckCircle },
    { label: "Sequência atual", value: "7 dias", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Meu Progresso</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{stat.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Mensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>15 de 20 roteiros</span>
                <span className="text-muted-foreground">75%</span>
              </div>
              <Progress value={75} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyProgress;
