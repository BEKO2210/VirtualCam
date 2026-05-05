import { Drawer } from 'vaul';
import { RotateCcw, X } from 'lucide-react';
import { useStudio } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SettingsKey } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface FieldDef {
  key: SettingsKey;
  label: string;
  unit?: string;
  hint?: string;
}

const TECH_FIELDS: FieldDef[] = [
  { key: 'aperture', label: 'Blende', hint: 'f/1.4 … f/22' },
  { key: 'iso', label: 'ISO', hint: '50 … 102400' },
  { key: 'shutterSpeed', label: 'Belichtung', hint: '1/4000s … 30s' },
  { key: 'resolution', label: 'Auflösung', hint: '4K · 6K · 8K' },
  { key: 'bitDepth', label: 'Bit-Tiefe', hint: '10-bit · 12-bit · 14-bit' },
  { key: 'aspectRatio', label: 'Format', hint: '3:2 · 16:9 · 65:24' },
  { key: 'focusMode', label: 'Fokus-Modus', hint: 'AF-S · AF-C · MF' },
  { key: 'depthOfField', label: 'Tiefenschärfe', hint: 'razor-thin … hyperfocal' },
];

const LOOK_FIELDS: FieldDef[] = [
  { key: 'colorProfile', label: 'Color Profile' },
  { key: 'lightingStyle', label: 'Lichtstil' },
  { key: 'highlightTemp', label: 'Highlight-Temperatur' },
  { key: 'shadowTemp', label: 'Schatten-Temperatur' },
  { key: 'colorTone', label: 'Farbton' },
  { key: 'contrastCurve', label: 'Kontrastkurve' },
  { key: 'saturation', label: 'Sättigung' },
  { key: 'grainSetting', label: 'Korn / Grain' },
];

const SCENE_FIELDS: FieldDef[] = [
  { key: 'lightingSetup', label: 'Light Setup' },
  { key: 'bgType', label: 'Hintergrund' },
  { key: 'bgBlur', label: 'BG Blur' },
  { key: 'bokehShape', label: 'Bokeh' },
  { key: 'skyTreatment', label: 'Himmel' },
  { key: 'filterStyle', label: 'Filter' },
  { key: 'perspectiveControl', label: 'Perspektive' },
  { key: 'negativeInstructions', label: 'Negative Instructions' },
];

export function SettingsDrawer({ open, onOpenChange }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.5, 0.92]} fadeFromIndex={1}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-full max-h-[92vh] outline-none">
          <div className="flex h-full flex-col rounded-t-[var(--radius-lg)] glass-strong">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/15 shrink-0" />
            <Header />
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-5 pb-safe">
              <FieldGroup title="Technische Einstellungen" fields={TECH_FIELDS} />
              <FieldGroup title="Licht & Look" fields={LOOK_FIELDS} />
              <FieldGroup title="Szene & Komposition" fields={SCENE_FIELDS} />
              <div className="h-8" />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Header() {
  const reset = useStudio((s) => s.resetSettings);
  const dirty = useStudio((s) => Object.keys(s.settings).length);
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

function FieldGroup({ title, fields }: { title: string; fields: FieldDef[] }) {
  return (
    <section>
      <div className="px-1 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <Field key={f.key} field={f} />
        ))}
      </div>
    </section>
  );
}

function Field({ field }: { field: FieldDef }) {
  const value = useStudio((s) => s.settings[field.key] ?? '');
  const placeholder = useStudio((s) => {
    if (!s.genreKey || !s.raw) return field.hint ?? '';
    const tpl = s.raw.templates[s.genreKey];
    const k = field.key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    return tpl?.defaults?.[k] ?? field.hint ?? '';
  });
  const setSettings = useStudio((s) => s.setSettings);
  const isDirty = !!value;
  return (
    <label
      className={cn(
        'block rounded-[var(--radius-sm)] border bg-white/[0.02] p-2.5 transition-colors',
        isDirty
          ? 'border-[color-mix(in_oklch,var(--color-primary)_45%,transparent)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-foreground/55 font-medium">{field.label}</span>
        {isDirty && <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />}
      </div>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setSettings({ [field.key]: e.target.value })}
        className="h-8 text-[12px] bg-transparent border-0 px-0 focus-visible:border-0 focus-visible:ring-0 font-mono"
      />
    </label>
  );
}
