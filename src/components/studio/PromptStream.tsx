import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, Download, Sliders } from 'lucide-react';
import { usePrompt, useResolvedSelection } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  onOpenSettings: () => void;
}

export function PromptStream({ onOpenSettings }: Props) {
  const { text, tokens } = usePrompt();
  const { brand, camera, lens, genre, compat } = useResolvedSelection();
  const [copied, setCopied] = useState(false);
  const lastTokensRef = useRef<string>('');

  // Track which tokens just changed to flash them.
  const changedKeys = useMemo(() => {
    const sig = tokens.map((t) => `${t.key}=${t.value}`).join('|');
    const prev = lastTokensRef.current;
    lastTokensRef.current = sig;
    if (!prev) return new Set<string>();
    const prevMap = new Map(prev.split('|').map((s) => s.split('=') as [string, string]));
    const out = new Set<string>();
    for (const t of tokens) if (prevMap.get(t.key) !== t.value) out.add(`${t.key}:${t.start}`);
    return out;
  }, [tokens]);

  const ready = !!(brand && camera && lens && genre);

  const onCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${camera?.name?.replace(/\s+/g, '-') ?? 'cameraprompt'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-strong rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header — two rows on mobile, one row from sm: up */}
      <div className="px-4 pt-3 pb-2 border-b border-[var(--color-border)] space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="size-2 rounded-full bg-[var(--color-success)] pulse-glow" />
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/50">
              Live Prompt
            </div>
          </div>
          {genre && <Badge variant="primary">{genre.name}</Badge>}
          {compat?.status === 'adapted' && <Badge variant="warn">Adapter</Badge>}
        </div>
        <div className="flex items-center justify-end gap-1.5 sm:ml-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSettings}
            aria-label="Einstellungen"
            title="Einstellungen"
          >
            <Sliders className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDownload}
            disabled={!text}
            aria-label="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button variant="default" size="sm" onClick={onCopy} disabled={!text} className="gap-1.5 px-3">
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="size-3.5" /> Kopiert
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-1.5"
                >
                  <Copy className="size-3.5" /> Copy
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="relative max-h-[40vh] overflow-y-auto">
        {ready ? (
          <PromptText text={text} tokens={tokens} changed={changedKeys} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Stats footer */}
      {ready && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--color-border)] text-[10px] font-mono text-foreground/40">
          <span>{text.length} chars</span>
          <span className="opacity-50">·</span>
          <span>{tokens.length} variables</span>
          <span className="opacity-50">·</span>
          <span>{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      )}
    </div>
  );
}

function PromptText({
  text,
  tokens,
  changed,
}: {
  text: string;
  tokens: ReturnType<typeof usePrompt>['tokens'];
  changed: Set<string>;
}) {
  // Build inline segments alternating text + animated <mark> for each token.
  const segments: Array<{ kind: 'text' | 'token'; value: string; key?: string; tokenKey?: string }> = [];
  let cursor = 0;
  for (const t of tokens) {
    if (t.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, t.start) });
    }
    segments.push({
      kind: 'token',
      value: text.slice(t.start, t.end),
      key: `${t.key}:${t.start}`,
      tokenKey: t.key,
    });
    cursor = t.end;
  }
  if (cursor < text.length) segments.push({ kind: 'text', value: text.slice(cursor) });

  return (
    <pre className="whitespace-pre-wrap font-mono text-[12.5px] sm:text-[13px] leading-relaxed text-foreground/85 px-4 py-4">
      {segments.map((seg, i) =>
        seg.kind === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <PromptToken key={`${seg.key}-${i}`} value={seg.value} flashing={!!seg.key && changed.has(seg.key)} />
        ),
      )}
    </pre>
  );
}

function PromptToken({ value, flashing }: { value: string; flashing: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={
        flashing
          ? {
              backgroundColor: [
                'color-mix(in oklch, var(--color-primary) 50%, transparent)',
                'color-mix(in oklch, var(--color-primary) 0%, transparent)',
              ],
              color: ['oklch(0.99 0 0)', 'oklch(0.95 0.05 60)'],
            }
          : { backgroundColor: 'transparent', color: 'oklch(0.95 0.05 60)' }
      }
      transition={{ duration: 1.1, ease: 'easeOut' }}
      className={cn(
        'rounded px-0.5 -mx-0.5 transition-colors text-[var(--color-primary)] font-medium',
      )}
    >
      {value}
    </motion.span>
  );
}

function EmptyState() {
  // Walks the user through what to pick next.
  const sel = useResolvedSelection();
  const next =
    !sel.brand
      ? 'Wähle eine Marke'
      : !sel.camera
        ? 'Wähle ein Kameramodell'
        : !sel.lens
          ? 'Wähle ein Objektiv'
          : !sel.genre
            ? 'Wähle ein Genre'
            : '';
  return (
    <div className="px-6 py-12 text-center">
      <div className="text-foreground/40 text-sm">{next || 'Setup wird zusammengesetzt...'}</div>
      <Steps active={!sel.brand ? 0 : !sel.camera ? 1 : !sel.lens ? 2 : 3} />
    </div>
  );
}

function Steps({ active }: { active: number }) {
  const steps = ['Marke', 'Kamera', 'Objektiv', 'Genre'];
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div
            className={cn(
              'size-2 rounded-full transition-colors',
              i < active
                ? 'bg-[var(--color-primary)]'
                : i === active
                  ? 'bg-[var(--color-primary)] pulse-glow'
                  : 'bg-white/15',
            )}
          />
          <span
            className={cn(
              'text-[10px] font-mono uppercase tracking-[0.16em] transition-colors',
              i <= active ? 'text-foreground/70' : 'text-foreground/30',
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && <div className="w-3 h-px bg-white/10" />}
        </div>
      ))}
    </div>
  );
}
