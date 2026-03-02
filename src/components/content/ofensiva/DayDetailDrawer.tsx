import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import FireIcon from "./FireIcon";

export interface DayProgress {
  date: Date;
  minutes: number;
  status: 'complete' | 'partial' | 'empty' | 'freeze';
}

interface DayDetailDrawerProps {
  selectedDay: DayProgress | null;
  onClose: () => void;
  goalMinutes: number;
}

const DayDetailDrawer = ({ selectedDay, onClose, goalMinutes }: DayDetailDrawerProps) => {
  const getStatusText = (status: DayProgress['status']) => {
    switch (status) {
      case 'complete':
        return 'Meta completa';
      case 'partial':
        return 'Meta parcial';
      case 'empty':
        return 'Nenhuma criação';
      case 'freeze':
        return 'Bloqueio de Ofensiva utilizado';
    }
  };

  const getStatusColor = (status: DayProgress['status']) => {
    switch (status) {
      case 'complete':
        return 'text-orange-400';
      case 'partial':
        return 'text-yellow-500';
      case 'empty':
        return 'text-muted-foreground';
      case 'freeze':
        return 'text-cyan-400';
    }
  };

  return (
    <Drawer open={!!selectedDay} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[40vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-semibold">
            {selectedDay && format(selectedDay.date, "d 'de' MMMM", { locale: ptBR })}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-6 pb-8 space-y-4">
          {/* Ícone e status */}
          <div className="flex flex-col items-center gap-3">
            {selectedDay?.status === 'freeze' ? (
              <span className="text-4xl">❄️</span>
            ) : (
              <FireIcon 
                minutes={selectedDay?.minutes || 0} 
                goalMinutes={goalMinutes} 
                size="lg" 
              />
            )}
            
            <p className={`text-sm font-medium ${getStatusColor(selectedDay?.status || 'empty')}`}>
              {getStatusText(selectedDay?.status || 'empty')}
            </p>
          </div>
          
          {/* Tempo criado */}
          {selectedDay?.status !== 'freeze' && (
            <div className="text-center space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {Math.round(selectedDay?.minutes || 0)} min
              </p>
              <p className="text-xs text-muted-foreground">
                criados neste dia
              </p>
              
              {selectedDay?.status === 'partial' && (
                <p className="text-xs text-yellow-500/80 mt-2">
                  Faltaram {Math.round(goalMinutes - (selectedDay?.minutes || 0))} min para completar a meta
                </p>
              )}
            </div>
          )}
          
          {selectedDay?.status === 'freeze' && (
            <p className="text-xs text-center text-muted-foreground">
              Sua ofensiva foi protegida automaticamente neste dia
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DayDetailDrawer;
