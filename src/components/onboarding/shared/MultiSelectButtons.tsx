import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MultiSelectButtonsProps {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export const MultiSelectButtons = ({
  options,
  selected,
  onChange,
  className,
}: MultiSelectButtonsProps) => {
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <Button
            key={option.id}
            variant={isSelected ? "default" : "outline"}
            size="lg"
            onClick={() => toggleOption(option.id)}
            className={cn(
              "relative min-w-[140px] transition-all",
              isSelected && "pr-10"
            )}
          >
            {option.label}
            {isSelected && (
              <Check className="absolute right-3 w-4 h-4" />
            )}
          </Button>
        );
      })}
    </div>
  );
};
