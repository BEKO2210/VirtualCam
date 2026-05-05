import { useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Aperture, Camera, Dices, Search, Tag, Wand2 } from 'lucide-react';
import { useRaw, useStudio } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const raw = useRaw();
  const setBrand = useStudio((s) => s.setBrand);
  const setCamera = useStudio((s) => s.setCamera);
  const setLens = useStudio((s) => s.setLens);
  const setGenre = useStudio((s) => s.setGenre);
  const randomize = useStudio((s) => s.randomize);

  const items = useMemo(() => {
    if (!raw) return [];
    const out: Array<{
      group: string;
      label: string;
      hint?: string;
      icon: React.ReactNode;
      run: () => void;
    }> = [
      {
        group: 'Aktionen',
        label: 'Zufälliges Setup',
        hint: '⌘ R',
        icon: <Dices className="size-4" />,
        run: () => randomize(),
      },
    ];
    for (const b of Object.values(raw.cameras)) {
      out.push({
        group: 'Marken',
        label: b.brand,
        hint: `${b.format} · ${b.mount}`,
        icon: <Tag className="size-4" />,
        run: () => setBrand(b.key),
      });
      for (const m of b.models) {
        out.push({
          group: 'Bodies',
          label: m.name,
          hint: m.sensor,
          icon: <Camera className="size-4" />,
          run: () => {
            setBrand(b.key);
            setCamera(m.id);
          },
        });
      }
    }
    for (const [mountKey, m] of Object.entries(raw.lenses)) {
      for (const l of m.lenses) {
        out.push({
          group: 'Objektive',
          label: l.name,
          hint: `${l.focal_length} · ${l.max_aperture} · ${m.mount}`,
          icon: <Aperture className="size-4" />,
          run: () => setLens(mountKey, l.id),
        });
      }
    }
    for (const g of Object.values(raw.templates)) {
      out.push({
        group: 'Genres',
        label: g.name,
        hint: g.description,
        icon: <Wand2 className="size-4" />,
        run: () => setGenre(g.key),
      });
    }
    return out;
  }, [raw, randomize, setBrand, setCamera, setLens, setGenre]);

  // ⌘K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r' && open) {
        e.preventDefault();
        randomize();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange, randomize]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      let arr = map.get(it.group);
      if (!arr) map.set(it.group, (arr = []));
      arr.push(it);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-[14vh] left-1/2 -translate-x-1/2 z-50 w-[min(640px,92vw)] glass-strong rounded-[var(--radius-lg)] overflow-hidden',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Schnellsuche</DialogPrimitive.Title>
          <Command label="Schnellsuche" className="flex flex-col max-h-[70vh]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
              <Search className="size-4 text-foreground/50" />
              <Command.Input
                autoFocus
                placeholder="Tippe einen Begriff: »A7R«, »85 1.4«, »portrait« …"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/40"
              />
              <kbd className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-mono text-foreground/50">
                ESC
              </kbd>
            </div>
            <Command.List className="overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-foreground/50">
                Nichts gefunden.
              </Command.Empty>
              {groups.map(([group, list]) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 font-mono [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {list.slice(0, 80).map((it, i) => (
                    <Command.Item
                      key={`${group}-${i}-${it.label}`}
                      value={`${it.label} ${it.hint ?? ''}`}
                      onSelect={() => {
                        it.run();
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] cursor-pointer text-sm data-[selected=true]:bg-white/5 data-[selected=true]:text-foreground"
                    >
                      <div className="text-foreground/50">{it.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{it.label}</div>
                        {it.hint && (
                          <div className="text-[11px] text-foreground/45 font-mono truncate">{it.hint}</div>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
