import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, Copy, Search, Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRaw } from '@/lib/store';
import { buildIndex, searchPrompts, type PromptIndex } from '@/lib/prompt-index';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PromptBrowser({ open, onOpenChange }: Props) {
  const raw = useRaw();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

  const index = useMemo<PromptIndex | null>(
    () => (raw ? buildIndex(raw.prompts) : null),
    [raw],
  );

  const results = useMemo(() => {
    if (!index) return [];
    return searchPrompts(index, deferred, { genre: genre ?? undefined, brand: brand ?? undefined }, 1000);
  }, [index, deferred, genre, brand]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 168,
    overscan: 6,
  });

  // Reset filters when sheet opens
  useEffect(() => {
    if (!open) {
      setQuery('');
      setGenre(null);
      setBrand(null);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Prompt Browser
              <Badge variant="primary">{raw?.prompts.length ?? 0}</Badge>
            </SheetTitle>
          </div>
          <SheetDescription>
            Durchsuche {raw?.prompts.length ?? 0} kuratierte Prompts. Fuzzy search powered by uFuzzy.
          </SheetDescription>
          <div className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Kamera, Objektiv, Genre …"
                className="pl-9"
              />
            </div>
          </div>
          <FilterBar
            raw={raw}
            genre={genre}
            brand={brand}
            onGenre={setGenre}
            onBrand={setBrand}
          />
          <div className="text-[11px] font-mono text-foreground/40 pt-1">
            {results.length} Treffer
          </div>
        </SheetHeader>

        <div ref={parentRef} className="flex-1 overflow-y-auto px-4 py-3">
          {results.length === 0 ? (
            <div className="text-center py-12 text-sm text-foreground/50">Keine Treffer.</div>
          ) : (
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const result = results[vi.index];
                const entry = raw?.prompts[result.index];
                if (!entry) return null;
                return (
                  <div
                    key={vi.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${vi.start}px)`,
                      paddingBottom: 12,
                    }}
                    ref={rowVirtualizer.measureElement}
                    data-index={vi.index}
                  >
                    <PromptCard entry={entry} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterBar({
  raw,
  genre,
  brand,
  onGenre,
  onBrand,
}: {
  raw: ReturnType<typeof useRaw>;
  genre: string | null;
  brand: string | null;
  onGenre: (v: string | null) => void;
  onBrand: (v: string | null) => void;
}) {
  if (!raw) return null;
  const genres = Object.values(raw.templates).slice(0, 8);
  const activeFilters = (genre ? 1 : 0) + (brand ? 1 : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-foreground/40 font-mono">
        <Filter className="size-3" /> Genre
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto size-5"
            onClick={() => {
              onGenre(null);
              onBrand(null);
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {genres.map((g) => {
          const active = genre === g.key;
          return (
            <button
              key={g.key}
              onClick={() => onGenre(active ? null : g.key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] border transition-colors',
                active
                  ? 'bg-[color-mix(in_oklch,var(--color-primary)_24%,transparent)] border-[color-mix(in_oklch,var(--color-primary)_50%,transparent)] text-foreground'
                  : 'border-[var(--color-border)] text-foreground/60 hover:text-foreground hover:bg-white/5',
              )}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PromptCard({ entry }: { entry: import('@/types').PromptEntry }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white/[0.02] p-3 hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          <Badge variant="primary">{entry.metadata.genre_name ?? entry.metadata.genre}</Badge>
          <Badge variant="outline" className="normal-case">
            {entry.metadata.camera}
          </Badge>
          <Badge variant="outline" className="normal-case">
            {entry.metadata.lens}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(entry.prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          aria-label="Kopieren"
        >
          {copied ? <Check className="size-3.5 text-[var(--color-success)]" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <p className="text-[12px] text-foreground/75 leading-relaxed line-clamp-4 font-mono">
        {entry.prompt}
      </p>
    </div>
  );
}
