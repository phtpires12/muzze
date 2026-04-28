import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Sun, Plane } from 'lucide-react';
import type { HolidayAlert } from '@/core/hooks/useHolidayAlert';
import { ROUTES } from "@/routes/routes";


interface HolidayAlertDialogProps {
  alert: HolidayAlert | null;
  onDismiss: () => void;
  onRemindLater: () => void;
}

export function HolidayAlertDialog({ alert, onDismiss, onRemindLater }: HolidayAlertDialogProps) {
  const navigate = useNavigate();

  if (!alert) return null;

  const isVacation = alert.type === 'vacation_approaching' || alert.type === 'vacation_active';
  const Icon = isVacation ? (alert.type === 'vacation_active' ? Sun : Plane) : CalendarDays;

  const handlePlan = () => {
    onDismiss();
    navigate(ROUTES.CALENDARIO);
  };

  return (
    <Dialog open={!!alert} onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-2">
            <Icon className="w-7 h-7 text-accent" />
          </div>
          <DialogTitle className="text-xl">{alert.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {alert.description}
          </DialogDescription>
          {alert.dates && (
            <p className="text-sm text-muted-foreground font-medium mt-1">
              📅 {alert.dates}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handlePlan} className="w-full">
            Quero me programar
          </Button>
          <Button variant="outline" onClick={onDismiss} className="w-full">
            Já estou preparado
          </Button>
          <Button variant="ghost" onClick={onRemindLater} className="w-full text-muted-foreground">
            Lembrar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
