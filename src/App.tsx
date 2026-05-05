import { useEffect, useState } from 'react';
import { Aperture } from 'lucide-react';
import type { CameraBrand, CameraImagesDoc, GenreTemplate, LensMount, PromptEntry, RawData } from '@/types';
import { useStudio } from '@/lib/store';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { HeroStage } from '@/components/hero/HeroStage';
import { PromptStream } from '@/components/studio/PromptStream';
import { SettingsDrawer } from '@/components/studio/SettingsDrawer';
import { PromptBrowser } from '@/components/studio/PromptBrowser';
import { CommandPalette } from '@/components/studio/CommandPalette';
import { CreditsSheet } from '@/components/studio/CreditsSheet';

export default function App() {
  const setRaw = useStudio((s) => s.setRaw);
  const setCameraImages = useStudio((s) => s.setCameraImages);
  const setError = useStudio((s) => s.setError);
  const randomize = useStudio((s) => s.randomize);
  const loading = useStudio((s) => s.loading);
  const error = useStudio((s) => s.error);
  const raw = useStudio((s) => s.raw);

  // Handle PWA shortcut: ?action=random launches a random setup once
  // data has loaded. The URL is then cleaned so reload doesn't re-fire.
  useEffect(() => {
    if (!raw) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'random') {
      randomize();
      params.delete('action');
      const q = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (q ? `?${q}` : '') + window.location.hash,
      );
    }
  }, [raw, randomize]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

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

        // Camera images are best-effort. If the CI fetch step fails or the
        // file isn't present yet, we just keep the procedural fallback.
        try {
          const r = await fetch(`${base}data/camera-images.json`);
          if (r.ok) {
            const doc = (await r.json()) as CameraImagesDoc;
            if (!cancelled) setCameraImages(doc);
          }
        } catch {
          /* ignore — procedural fallback */
        }
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
        <Footer onOpenCredits={() => setCreditsOpen(true)} />
      </main>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PromptBrowser open={browserOpen} onOpenChange={setBrowserOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <CreditsSheet open={creditsOpen} onOpenChange={setCreditsOpen} />
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

function Footer({ onOpenCredits }: { onOpenCredits: () => void }) {
  return (
    <footer className="pt-6 pb-10 text-center space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/35">
        CameraPrompt Pro · Modular Studio
      </div>
      <button
        onClick={onOpenCredits}
        className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/45 hover:text-foreground/80 transition-colors underline-offset-4 hover:underline"
      >
        Bildnachweise · Wikimedia Commons
      </button>
    </footer>
  );
}
