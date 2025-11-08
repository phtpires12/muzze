import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WORKFLOWS, setUserWorkflow, completeOnboarding, type WorkflowType } from "@/lib/workflows";
import { Check } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const navigate = useNavigate();

  const handleWorkflowSelect = (type: WorkflowType) => {
    setSelectedWorkflow(type);
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && selectedWorkflow) {
      setUserWorkflow(selectedWorkflow);
      completeOnboarding();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {step === 1 && (
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Bem-vindo ao Criador Constante
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              O app que transforma disciplina criativa em jogo.
              <br />
              Mais constância, menos culpa. Mais execução, menos enrolação.
            </p>
            <Button size="lg" onClick={handleContinue} className="mt-8">
              Começar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Qual é o seu maior desafio?</h2>
              <p className="text-muted-foreground">
                Escolha o perfil que mais se identifica com você
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(WORKFLOWS).map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    selectedWorkflow === workflow.id
                      ? 'border-2 border-primary bg-primary/5 shadow-xl'
                      : 'border-2 border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => handleWorkflowSelect(workflow.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="text-5xl w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: workflow.color + '20' }}
                      >
                        {workflow.icon}
                      </div>
                      {selectedWorkflow === workflow.id && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-2">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {workflow.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-destructive">
                          Problema:
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {workflow.problem}
                        </p>
                        
                        <div className="text-xs font-semibold" style={{ color: workflow.color }}>
                          Solução:
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {workflow.solution}
                        </p>
                        
                        <div className="pt-2">
                          <div className="text-xs font-semibold mb-2">Recursos:</div>
                          <ul className="space-y-1">
                            {workflow.features.slice(0, 3).map((feature, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedWorkflow}
                className="min-w-[200px]"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
