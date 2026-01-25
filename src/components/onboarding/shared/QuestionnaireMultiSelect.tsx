import { motion } from "framer-motion";

interface QuestionnaireMultiSelectOption {
  id: string;
  label: string;
}

interface QuestionnaireMultiSelectProps {
  options: QuestionnaireMultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

// Array de emojis para itens selecionados
const SELECTION_EMOJIS = ["💪", "🎯", "🔥", "✨", "💎", "🚀", "⚡", "🌟"];

// Gera um emoji consistente baseado no ID da opção
const getEmojiForId = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SELECTION_EMOJIS[Math.abs(hash) % SELECTION_EMOJIS.length];
};

export const QuestionnaireMultiSelect = ({
  options,
  selected,
  onChange,
}: QuestionnaireMultiSelectProps) => {
  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        const emoji = getEmojiForId(option.id);

        return (
          <motion.button
            key={option.id}
            onClick={() => handleToggle(option.id)}
            className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300"
                : "bg-violet-200/60 hover:bg-violet-200/80"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              {isSelected && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xl"
                >
                  {emoji}
                </motion.span>
              )}
              <p
                className={`font-medium text-base ${
                  isSelected ? "text-white" : "text-foreground"
                }`}
              >
                {option.label}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
