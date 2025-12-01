import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Screen6CurrentPostsProps {
  value: number;
  onChange: (value: number) => void;
}

export const Screen6CurrentPosts = ({
  value,
  onChange,
}: Screen6CurrentPostsProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Quantos posts você já fez?</h2>
        <p className="text-muted-foreground">
          Desde que começou a tentar ser consistente, quantas vezes você de fato publicou?
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <Label htmlFor="current-posts" className="text-center block">
          Número de posts publicados
        </Label>
        <Input
          id="current-posts"
          type="number"
          min="0"
          max="10000"
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder="Ex: 15"
          className="text-lg h-14 text-center"
          autoFocus
        />
        <p className="text-sm text-muted-foreground text-center">
          Não se preocupe com o número. Estamos só diagnosticando.
        </p>
      </div>
    </div>
  );
};
