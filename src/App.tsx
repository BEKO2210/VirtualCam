import { useEffect, useState } from 'react';
import { Aperture } from 'lucide-react';
import type { CameraBrand, GenreTemplate, LensMount, PromptEntry, RawData } from '@/types';
import { useStudio } from '@/lib/store';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { HeroStage } from '@/components/hero/HeroStage';
import { PromptStream } from '@/components/studio/PromptStream';
import { SettingsDrawer } from '@/components/studio/SettingsDrawer';
import { PromptBrowser } from '@/components/studio/PromptBrowser';
import { CommandPalette } from '@/components/studio/CommandPalette';

export default function App() {
  const setRaw = useStudio((s) => s.setRaw);
  const setError = useStudio((s) => s.setError);
  const loading = useStudio((s) => s.loading);
  const error = useStudio((s) => s.error);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL;
        const [cameras, lenses, templates, promptsDoc] = await Promise.all([
          fetch(`${base}data/cameras.json`).then((r) => r.json()),
          fetch(`${base}data/lenses.json`).then((r) => r.json()),
          fetch(`${base}data/templates.json`).then((r) => r.json()),
          fetch(`${base}data/prompts.json`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        const raw: RawData = {
          cameras: cameras as Record<string, CameraBrand>,
          lenses: lenses as Record<string, LensMount>,
          templates: templates as Record<string, GenreTemplate>,
          prompts: (promptsDoc.prompts ?? promptsDoc) as PromptEntry[],
        };
        setRaw(raw);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load data');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setRaw, setError]);

  if (loading) return <SplashScreen />;
  if (error) return <ErrorScreen msg={error} />;

  return (
    <div className="min-h-dvh">
      <StudioHeader
        onOpenBrowser={() => setBrowserOpen(true)}
        onOpenCommand={() => setPaletteOpen(true)}
      />

      <main className="px-3 sm:px-5 pt-3 pb-6 space-y-3 max-w-3xl mx-auto">
        <HeroStage />
        <PromptStream onOpenSettings={() => setSettingsOpen(true)} />
        <Footer />
      </main>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PromptBrowser open={browserOpen} onOpenChange={setBrowserOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-dvh grid place-items-center">
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <Aperture className="size-12 text-[var(--color-primary)] animate-spin [animation-duration:3s]" />
        </div>
        <div className="text-sm font-mono uppercase tracking-[0.18em] text-foreground/60">
          Loading studio · cameras · lenses · prompts
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="glass rounded-[var(--radius-lg)] p-6 max-w-md">
        <div className="text-sm font-semibold mb-1">Studio konnte nicht geladen werden</div>
        <div className="text-xs text-foreground/60 font-mono break-all">{msg}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="pt-6 pb-10 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/35">
        CameraPrompt Pro · Modular Studio · Procedural Camera Rig
      </div>
    </footer>
  );
}
