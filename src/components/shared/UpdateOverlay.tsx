import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface UpdateOverlayProps {
  isVisible: boolean;
}

export function UpdateOverlay({ isVisible }: UpdateOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-6"
    >
      {/* Logo ou ícone */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw className="w-12 h-12 text-primary" />
      </motion.div>

      {/* Texto */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Atualizando Muzze...
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Uma nova versão está disponível. Aguarde enquanto atualizamos o app.
        </p>
      </div>

      {/* Barra de progresso indeterminada */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ x: '-100%', width: '40%' }}
          animate={{ x: '250%' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
