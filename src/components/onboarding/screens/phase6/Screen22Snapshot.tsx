import { DiagnosisSnapshot } from "../../shared/DiagnosisSnapshot";
import { FileText } from "lucide-react";
import { OnboardingData } from "@/types/onboarding";

interface Screen22SnapshotProps {
  data: OnboardingData;
  lostPosts: number;
}

export const Screen22Snapshot = ({ data, lostPosts }: Screen22SnapshotProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Seu diagnóstico personalizado</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Aqui está o resumo completo do que descobrimos sobre você.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <DiagnosisSnapshot data={data} lostPosts={lostPosts} />
      </div>

      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          A Muzze foi configurada com base nessas informações para te ajudar da melhor forma possível.
        </p>
      </div>
    </div>
  );
};
