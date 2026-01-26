import { motion } from "framer-motion";
import { ChevronLeft, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";

interface Screen7DiferencialProps {
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  progress: number;
}

const OTHER_APPS_CONS = [
  'Você gasta horas construindo "templates" e nem usa.',
  'Não querem saber se você postou ou não',
  'Não sabem seus objetivos, nem acompanham seu progresso',
  'Te deixam sozinho, tentando achar um caminho.',
];

const MUZZE_PROS = [
  'Você usa um sistema de criação Plug-n-Play',
  'Te perguntamos sobre o status das suas criações',
  'Apoiamos seus sonhos como criador de conteúdo',
  'Te entregamos o processo criativo das suas maiores referências.',
];

export function Screen7Diferencial({
  onContinue,
  onSkip,
  onBack,
}: Screen7DiferencialProps) {
  const handleReview = () => {
    // Open App Store URL (placeholder for production)
    window.open("https://apps.apple.com/app/muzze", "_blank");
    onContinue();
  };

  return (
    <div className="min-h-screen bg-violet-50 flex flex-col">
      {/* Header with back button only */}
      <div className="px-4 pt-12 sm:pt-16 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-violet-100 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 flex flex-col">
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-muted-foreground mb-2"
        >
          Nós super te entendemos!{" "}
          <span className="font-medium">E esse é o nosso diferencial!</span>
        </motion.p>

        {/* Title with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-2xl font-bold text-gray-900 mb-6"
        >
          Somos o primeiro app{" "}
          <span
            className="bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
          >
            pensado pra você, criador.
          </span>
        </motion.h1>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex gap-2 relative mb-6"
        >
          {/* Card: Outros Apps */}
          <div className="flex-1 bg-violet-100/80 border border-violet-200 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-gray-800 mb-3">
              Em
              <br />
              outros Apps:
            </h3>
            <ul className="space-y-3">
              {OTHER_APPS_CONS.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-600"
                >
                  <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow in the middle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-white rounded-full p-1.5 shadow-md">
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Card: Muzze */}
          <div className="flex-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <img src={muzzeLeafWhite} alt="Muzze" className="w-5 h-5" />
              <span className="text-white font-bold text-sm">muzze</span>
            </div>
            <ul className="space-y-3">
              {MUZZE_PROS.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-white"
                >
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Call to action text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mb-4"
        >
          Nos avalie na app store e nos
          <br />
          ajude a espalhar nossa missão!
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={handleReview}
            variant="gradient-pill"
            size="lg"
            className="w-full"
          >
            Avaliar
          </Button>

          <button
            onClick={onSkip}
            className="w-full py-2 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Agora não
          </button>
        </motion.div>
      </div>
    </div>
  );
}
