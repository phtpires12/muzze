import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyProgress } from "@/hooks/useMyProgress";

const MyProgress = () => {
  const navigate = useNavigate();
  const { 
    totalScripts, 
    completedShots, 
    currentStreak, 
    monthlyGoalHours, 
    monthlyProgressHours, 
    monthlyPercentage,
    loading 
  } = useMyProgress();

  const stats = [
    { label: "Roteiros criados", value: totalScripts, icon: FileText },
    { label: "Shots completos", value: completedShots, icon: CheckCircle },
    { label: "Sequência atual", value: `${currentStreak} dias`, icon: TrendingUp },
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
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              stats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{stat.value}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Mensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{monthlyProgressHours} de {monthlyGoalHours} horas</span>
                  <span className="text-muted-foreground">{monthlyPercentage}%</span>
                </div>
                <Progress value={monthlyPercentage} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyProgress;
