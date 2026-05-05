import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useRaw, useSelection, useStudio } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  onPicked: () => void;
  onBack: () => void;
}

export function PickGenre({ onPicked, onBack }: Props) {
  const raw = useRaw();
  const sel = useSelection();
  const setGenre = useStudio((s) => s.setGenre);
  if (!raw) return null;

  const genres = Object.values(raw.templates);

  return (
    <div className="space-y-3">
      <Header onBack={onBack} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {genres.map((g, i) => {
          const isActive = sel.genreKey === g.key;
          const hue = g.hue ?? 30;
          return (
            <motion.button
              key={g.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.012 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setGenre(g.key);
                onPicked();
              }}
              className={cn(
                'relative h-[88px] rounded-[var(--radius-sm)] overflow-hidden text-left ring-focus transition-transform',
                isActive ? 'ring-2 ring-[var(--color-primary)] scale-[1.01]' : '',
              )}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg,
                    oklch(0.42 0.18 ${hue}) 0%,
                    oklch(0.22 0.10 ${(hue + 40) % 360}) 65%,
                    oklch(0.14 0.04 ${(hue + 80) % 360}) 100%)`,
                }}
              />
              <div className="absolute inset-0 grid-paper opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="relative h-full p-2.5 flex flex-col justify-between">
                <Badge
                  variant="outline"
                  className="bg-black/40 backdrop-blur-sm border-white/10 w-fit text-[9px] py-0 h-4"
                >
                  {g.recommended_lenses[0]?.split(' ')[0] ?? 'Genre'}
                </Badge>
                <div>
                  <div className="text-[12.5px] font-semibold leading-tight text-white drop-shadow-md">
                    {g.name}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Zurück">
        <ArrowLeft className="size-4" />
      </Button>
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/45">
          Schritt 4 · 21 Genres
        </div>
        <div className="text-[15px] font-semibold tracking-tight">Welche Stimmung?</div>
      </div>
    </div>
  );
}
