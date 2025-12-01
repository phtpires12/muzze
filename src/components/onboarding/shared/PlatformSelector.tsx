import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import instagramLogo from "@/assets/instagram-logo.png";
import youtubeLogo from "@/assets/youtube-logo.png";
import tiktokLogo from "@/assets/tiktok-logo.png";

interface Platform {
  id: string;
  name: string;
  logo?: string;
  icon?: string;
}

interface PlatformSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
}

const PLATFORMS: Platform[] = [
  { id: "Instagram", name: "Instagram", logo: instagramLogo },
  { id: "TikTok", name: "TikTok", logo: tiktokLogo },
  { id: "YouTube", name: "YouTube", logo: youtubeLogo },
  { id: "X (Twitter)", name: "X (Twitter)", icon: "𝕏" },
];

export const PlatformSelector = ({
  selected,
  onChange,
  multiSelect = false,
}: PlatformSelectorProps) => {
  const togglePlatform = (id: string) => {
    if (multiSelect) {
      if (selected.includes(id)) {
        onChange(selected.filter((item) => item !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange([id]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {PLATFORMS.map((platform) => {
        const isSelected = selected.includes(platform.id);
        return (
          <Card
            key={platform.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:scale-105 relative",
              isSelected
                ? "border-2 border-primary bg-primary/5 shadow-lg"
                : "border-2 border-transparent hover:border-primary/20"
            )}
            onClick={() => togglePlatform(platform.id)}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="text-center space-y-2">
              {platform.logo ? (
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="w-20 h-20 mx-auto object-contain"
                />
              ) : (
                <div className="text-4xl font-bold">{platform.icon}</div>
              )}
              <p className="font-medium">{platform.name}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
