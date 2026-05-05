import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCameraImages, useRaw } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Bildnachweise / Credits — fulfills the CC-BY-SA "BY" clause for every
 * Wikimedia camera image bundled at build time.
 */
export function CreditsSheet({ open, onOpenChange }: Props) {
  const doc = useCameraImages();
  const raw = useRaw();
  const credits = doc?.credits ?? {};
  const cameraNameById = new Map<string, string>();
  if (raw) {
    for (const brand of Object.values(raw.cameras)) {
      for (const m of brand.models) cameraNameById.set(m.id, m.name);
    }
  }
  const entries = Object.entries(credits).sort(([, a], [, b]) =>
    a.filename.localeCompare(b.filename),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <SheetHeader>
          <SheetTitle>Bildnachweise</SheetTitle>
          <SheetDescription>
            Kamera-Fotos werden zur Build-Zeit von Wikimedia Commons geladen. Alle Bilder bleiben im
            Eigentum ihrer jeweiligen Fotografen und stehen unter den unten angegebenen Lizenzen.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-sm text-foreground/50">
              Noch keine Bilder geladen. Der Build-Schritt holt sie automatisch beim nächsten Deploy.
            </div>
          ) : (
            entries.map(([id, c]) => (
              <a
                key={id}
                href={c.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white/[0.02] p-3 hover:border-[var(--color-border-strong)] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={`${import.meta.env.BASE_URL}images/cameras/${c.file}`}
                    alt={c.filename}
                    loading="lazy"
                    className="w-16 h-16 object-contain rounded-md shrink-0 bg-black/20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold tracking-tight leading-tight line-clamp-1">
                      {cameraNameById.get(id) ?? id}
                    </div>
                    <div className="text-[10.5px] font-mono text-foreground/55 mt-0.5 line-clamp-2 break-all">
                      {c.filename}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] py-0 h-4 normal-case">
                        © {c.artist || 'unknown'}
                      </Badge>
                      <Badge variant="primary" className="text-[9px] py-0 h-4 normal-case">
                        {c.license}
                      </Badge>
                      <span className="text-[10px] text-foreground/40 inline-flex items-center gap-0.5 group-hover:text-foreground/70 transition-colors">
                        <ExternalLink className="size-2.5" />
                        Commons
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}

          <div className="pt-4 text-[10.5px] text-foreground/45 leading-relaxed">
            Diese App ist nicht mit den abgebildeten Herstellern verbunden. Markennamen und Modellbezeichnungen
            sind Eigentum der jeweiligen Inhaber und werden hier zu Identifikations- und Referenzzwecken verwendet.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
