import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useProductionSettings } from "@/core/hooks/useProductionSettings";

export function ProductionWorkflowWizard({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { settings, updateSettings, isUpdating } = useProductionSettings();
    const [step, setStep] = useState(1);
    const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg a Sex default
    const [scriptDays, setScriptDays] = useState(1);
    const [recordDays, setRecordDays] = useState(1);
    const [editDays, setEditDays] = useState(1);

    // Initialize from existing settings if any
    useEffect(() => {
        if (open && settings) {
            setWorkDays(settings.work_days || [1, 2, 3, 4, 5]);
            setScriptDays(settings.stage_slas?.script || 1);
            setRecordDays(settings.stage_slas?.recording || 1);
            setEditDays(settings.stage_slas?.editing || 1);
            setStep(1);
        } else if (open) {
            setStep(1);
        }
    }, [open, settings]);

    const daysOfWeek = [
        { id: 0, label: "Domingo" },
        { id: 1, label: "Segunda" },
        { id: 2, label: "Terça" },
        { id: 3, label: "Quarta" },
        { id: 4, label: "Quinta" },
        { id: 5, label: "Sexta" },
        { id: 6, label: "Sábado" },
    ];

    const handleToggleDay = (day: number) => {
        setWorkDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        );
    };

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);

    const handleFinish = async () => {
        if (workDays.length === 0) {
            // Must select at least one day
            alert("Por favor, selecione pelo menos um dia de trabalho.");
            return;
        }

        await updateSettings({
            is_enabled: true,
            work_days: workDays,
            stage_slas: {
                ideation: 1, // Default or implicit taking 1 day
                script: scriptDays,
                review: 1,
                recording: recordDays,
                editing: editDays,
                design: 1,
            }
        });

        onOpenChange(false);
    };

    // Skip step 1 if the user hasn't selected any workflow days and clicks next
    const checkAndNext = () => {
        if (step === 1 && workDays.length === 0) {
            alert("Por favor, selecione pelo menos um dia da semana para trabalhar.");
            return;
        }
        handleNext();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar Calendário de Produção</DialogTitle>
                    <DialogDescription>
                        Passo {step} de 4
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 min-h-[220px]">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-base">Quais dias da semana você usa para trabalhar e criar?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {daysOfWeek.map(day => (
                                    <div key={day.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`day-${day.id}`}
                                            checked={workDays.includes(day.id)}
                                            onCheckedChange={() => handleToggleDay(day.id)}
                                        />
                                        <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-base">Em média, quanto tempo você leva para <span className="text-purple-500 font-semibold">escrever um roteiro</span>?</h3>
                            <div className="flex flex-col gap-6 items-center pt-4">
                                <Slider
                                    value={[scriptDays]}
                                    onValueChange={([val]) => setScriptDays(val)}
                                    max={7}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-center font-bold text-3xl text-purple-600">{scriptDays}</div>
                                <div className="text-muted-foreground">dia{scriptDays > 1 ? 's' : ''}</div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-base">Em média, quanto tempo você leva para <span className="text-orange-500 font-semibold">gravar um conteúdo</span>?</h3>
                            <div className="flex flex-col gap-6 items-center pt-4">
                                <Slider
                                    value={[recordDays]}
                                    onValueChange={([val]) => setRecordDays(val)}
                                    max={7}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-center font-bold text-3xl text-orange-600">{recordDays}</div>
                                <div className="text-muted-foreground">dia{recordDays > 1 ? 's' : ''}</div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-base">Em média, quanto tempo você leva para <span className="text-cyan-500 font-semibold">editar um vídeo</span>?</h3>
                            <div className="flex flex-col gap-6 items-center pt-4">
                                <Slider
                                    value={[editDays]}
                                    onValueChange={([val]) => setEditDays(val)}
                                    max={7}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-center font-bold text-3xl text-cyan-600">{editDays}</div>
                                <div className="text-muted-foreground">dia{editDays > 1 ? 's' : ''}</div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full mt-4">
                    <div className="w-24">
                        {step > 1 && (
                            <Button variant="outline" onClick={handlePrev} className="w-full">Voltar</Button>
                        )}
                    </div>

                    <div className="w-32">
                        {step < 4 ? (
                            <Button onClick={checkAndNext} className="w-full">Próximo</Button>
                        ) : (
                            <Button onClick={handleFinish} disabled={isUpdating} className="w-full">
                                {isUpdating ? "Salvando..." : "Concluir"}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
