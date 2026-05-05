import { Drawer } from 'vaul';
import { RotateCcw, X } from 'lucide-react';
import { useStudio } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChipGroup } from '@/components/ui/chip-group';
import { FIELD_GROUPS } from '@/lib/setting-presets';
import type { SettingsKey } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Studio Einstellungen — every field is a tap-only chip group (no
 * free-text input). Drawer opens fully (95% of viewport) per @beko's
 * request: "Wenn ich auf Einstellung drücke soll das komplett ausfahren".
 */
export function SettingsDrawer({ open, onOpenChange }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.95]} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-12 h-full max-h-[95vh] outline-none">
          <div className="flex h-full flex-col rounded-t-[var(--radius-lg)] glass-strong">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/15 shrink-0" />
            <Header />
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-5 pb-[env(safe-area-inset-bottom,16px)]">
              <ModeSwitch />
              {FIELD_GROUPS.map((group) => (
                <section key={group.title}>
                  <div className="px-1 mb-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-foreground/45">
                    {group.title}
                  </div>
                  <div className="space-y-3.5">
                    {group.fields.map((f) => (
                      <ChipGroupField key={f.key} fieldKey={f.key} label={f.label} hint={f.hint} options={f.options} variant={f.kind === 'stops' ? 'stops' : 'chips'} />
                    ))}
                  </div>
                </section>
              ))}
              <div className="h-12" />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Header() {
  const reset = useStudio((s) => s.resetSettings);
  const dirty = useStudio((s) => Object.values(s.settings).filter(Boolean).length);
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
      <Drawer.Title className="text-sm font-semibold tracking-tight">Studio Einstellungen</Drawer.Title>
      <Badge variant="outline" className="ml-1 text-[10px]">
        {dirty} aktiv
      </Badge>
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon-sm" onClick={() => reset()} aria-label="Zurücksetzen">
          <RotateCcw className="size-4" />
        </Button>
        <Drawer.Close asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Schließen">
            <X className="size-4" />
          </Button>
        </Drawer.Close>
      </div>
    </div>
  );
}

function ModeSwitch() {
  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  return (
    <section>
      <div className="px-1 mb-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-foreground/45">
        Prompt-Modus
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['reconstruction', 'generation'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                'relative rounded-[var(--radius-sm)] border p-3 text-left transition-colors ring-focus ' +
                (active
                  ? 'border-[color-mix(in_oklch,var(--color-primary)_55%,transparent)] bg-[color-mix(in_oklch,var(--color-primary)_18%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent),0_4px_14px_-6px_var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white/[0.02] hover:border-[var(--color-border-strong)]')
              }
            >
              <div className="text-[12.5px] font-semibold tracking-tight">
                {m === 'reconstruction' ? 'Reconstruction' : 'Generation'}
              </div>
              <div className="text-[10.5px] text-foreground/60 mt-0.5 leading-snug">
                {m === 'reconstruction'
                  ? 'Bestehendes Foto restaurieren · Identität + Hintergrund bleiben'
                  : 'Neues Bild generieren · Editorial-Style'}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface ChipFieldProps {
  fieldKey: SettingsKey;
  label: string;
  hint?: string;
  options: readonly string[];
  variant: 'chips' | 'stops';
}

function ChipGroupField({ fieldKey, label, hint, options, variant }: ChipFieldProps) {
  const value = useStudio((s) => s.settings[fieldKey] ?? '');
  // Read the genre's default so we can show it as the active fallback when
  // the user hasn't picked anything yet.
  const defaultValue = useStudio((s) => {
    if (!s.genreKey || !s.raw) return '';
    const tpl = s.raw.templates[s.genreKey];
    const k = fieldKey.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    return tpl?.defaults?.[k] ?? '';
  });
  const setSettings = useStudio((s) => s.setSettings);
  const effective = value || defaultValue;

  return (
    <ChipGroup
      label={label}
      hint={hint}
      options={options}
      value={effective}
      onChange={(next) => setSettings({ [fieldKey]: next })}
      variant={variant}
    />
  );
}
