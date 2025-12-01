import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  children?: ReactNode;
  icon?: string;
  title?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const OnboardingCard = ({
  children,
  icon,
  title,
  description,
  className,
  onClick,
  selected = false,
}: OnboardingCardProps) => {
  return (
    <Card
      className={cn(
        "p-6 transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02]",
        selected && "border-2 border-primary bg-primary/5 shadow-lg",
        !selected && onClick && "border-2 border-transparent hover:border-primary/20",
        className
      )}
      onClick={onClick}
    >
      {icon && title && description ? (
        <div className="flex gap-4">
          <div className="text-3xl flex-shrink-0">{icon}</div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </Card>
  );
};
