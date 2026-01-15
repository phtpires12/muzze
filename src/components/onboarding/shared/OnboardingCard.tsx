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
        "p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md",
        selected && "border-2 border-primary shadow-sm",
        !selected && onClick && "border border-border hover:border-primary/50",
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
