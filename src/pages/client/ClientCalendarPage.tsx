import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ExternalLink, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ClientLayout } from "./ClientLayout";
import { useClientScripts, ClientScript } from "@/core/hooks/useClientScripts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClientCalendarPage = () => {
  const { publishedScripts, isLoading } = useClientScripts();
  const [selected, setSelected] = useState<ClientScript | null>(null);

  // Agrupar por mês
  const grouped = useMemo(() => {
    const groups: Record<string, ClientScript[]> = {};
    const sorted = [...publishedScripts].sort((a, b) => {
      const da = new Date(a.published_at || a.publish_date || 0).getTime();
      const db = new Date(b.published_at || b.publish_date || 0).getTime();
      return db - da;
    });
    for (const s of sorted) {
      const date = s.published_at || s.publish_date;
      if (!date) continue;
      const key = format(new Date(date), "MMMM yyyy", { locale: ptBR });
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }, [publishedScripts]);

  return (
    <ClientLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Calendário</h2>
          <p className="text-sm text-muted-foreground">
            Conteúdos que já foram pro ar.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">Nenhum conteúdo publicado ainda</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground capitalize">
                {month}
              </h3>
              <div className="space-y-2">
                {items.map((s) => {
                  const date = s.published_at || s.publish_date;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                      {s.thumbnail_url ? (
                        <img
                          src={s.thumbnail_url}
                          alt={s.title}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Film className="h-5 w-5 text-primary/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          {s.content_type && (
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {s.content_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer de detalhes (read-only) */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>{selected?.title}</DrawerTitle>
            {selected?.central_idea && (
              <DrawerDescription>{selected.central_idea}</DrawerDescription>
            )}
          </DrawerHeader>
          {selected?.thumbnail_url && (
            <img
              src={selected.thumbnail_url}
              alt={selected.title}
              className="w-full aspect-video object-cover rounded-xl"
            />
          )}
          <div className="space-y-2 mt-4">
            {selected?.published_at && (
              <p className="text-sm text-muted-foreground">
                Publicado em{" "}
                {format(new Date(selected.published_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
            {selected?.main_video_url && (
              <a
                href={selected.main_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium"
              >
                Ver post <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </ClientLayout>
  );
};

export default ClientCalendarPage;