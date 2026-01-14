import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Wifi } from 'lucide-react';

export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, close } = usePWAUpdate();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-between gap-3 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4">
      {needRefresh ? (
        <>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Nova versão disponível!</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => updateServiceWorker(true)}
              className="font-medium"
            >
              Atualizar
            </Button>
            <Button size="icon" variant="ghost" onClick={close} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 shrink-0" />
            <span className="text-sm">Pronto para uso offline</span>
          </div>
          <Button size="icon" variant="ghost" onClick={close} className="h-8 w-8 shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
