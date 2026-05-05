import { Aperture, Dices, History, Search, Sparkles, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudio } from '@/lib/store';

interface Props {
  onOpenBrowser: () => void;
  onOpenCommand: () => void;
}

export function StudioHeader({ onOpenBrowser, onOpenCommand }: Props) {
  const randomize = useStudio((s) => s.randomize);
  const save = useStudio((s) => s.saveToHistory);

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3">
      <div className="glass rounded-[var(--radius-lg)] flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Aperture className="size-6 text-[var(--color-primary)]" />
            <Sparkles className="size-3 text-[var(--color-accent)] absolute -top-1 -right-1" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">CameraPrompt Pro</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-foreground/50 hidden sm:block">
              Procedural Studio · Modular Camera Prompts
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex gap-2 text-foreground/70"
            onClick={onOpenCommand}
          >
            <Search className="size-3.5" />
            <span className="text-xs">Schnellsuche</span>
            <kbd className="ml-1 hidden lg:inline-block rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-mono text-foreground/60">
              ⌘K
            </kbd>
          </Button>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onOpenCommand} aria-label="Suche">
            <Search className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenBrowser} className="gap-2">
            <History className="size-3.5" />
            <span className="hidden sm:inline text-xs">10K Prompts</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => save()} aria-label="Setup speichern">
            <Bookmark className="size-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => randomize()} className="gap-2">
            <Dices className="size-3.5" />
            <span className="hidden sm:inline">Random</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
