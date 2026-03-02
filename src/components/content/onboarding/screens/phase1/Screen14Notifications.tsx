import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, Flame, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GradientProgressBar } from "@/components/content/onboarding/shared/GradientProgressBar";
import { useNotifications } from '@/core/hooks';

interface Screen14NotificationsProps {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username?: string;
}

const BENEFITS = [
  { icon: Bell, text: "Lembrete no horário que você escolheu" },
  { icon: Flame, text: "Avisos de ofensivas em risco" },
  { icon: Trophy, text: "Celebração de conquistas e marcos" },
  { icon: Settings, text: "Você pode desativar a qualquer momento" },
];

export const Screen14Notifications = ({
  onContinue,
  onBack,
  progress,
  username,
}: Screen14NotificationsProps) => {
  const { requestPermission, isLoading } = useNotifications();
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    await requestPermission();
    setActivating(false);
    onContinue();
  };

  const firstName = username?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-violet-50 dark:bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {firstName
                ? `${firstName}, podemos te mandar notificações nesse horário e/ou em outros?`
                : "Podemos te mandar notificações nesse horário e/ou em outros?"}
            </h1>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              variant="gradient-pill"
              size="xl"
              className="w-full"
              onClick={handleActivate}
              disabled={activating || isLoading}
            >
              <Bell className="w-5 h-5 mr-2" />
              {activating ? "Ativando..." : "Ativar notificações"}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full text-muted-foreground"
              onClick={onContinue}
              disabled={activating}
            >
              Pular por enquanto
            </Button>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-violet-200 dark:border-border">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">
                  Por que ativar notificações?
                </h3>
                <ul className="space-y-3">
                  {BENEFITS.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <benefit.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {benefit.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
