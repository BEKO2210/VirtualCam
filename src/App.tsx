import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Aperture } from 'lucide-react';
import type { CameraBrand, GenreTemplate, LensMount, PromptEntry, RawData } from '@/types';
import { useStudio } from '@/lib/store';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { QuickRail } from '@/components/studio/QuickRail';
import { CameraLensRail } from '@/components/studio/CameraLensRail';
import { CameraRig } from '@/components/rig/CameraRig';
import { PromptStream } from '@/components/studio/PromptStream';
import { SettingsDrawer } from '@/components/studio/SettingsDrawer';
import { PromptBrowser } from '@/components/studio/PromptBrowser';
import { CommandPalette } from '@/components/studio/CommandPalette';
import { useResolvedSelection } from '@/lib/store';

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

      <main className="px-3 sm:px-6 py-4 space-y-4 max-w-7xl mx-auto">
        <RigSection />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(360px,420px)] gap-4">
          <div className="space-y-4">
            <QuickRail />
            <CameraLensRail />
          </div>
          <PromptStream onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        <Footer />
      </main>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PromptBrowser open={browserOpen} onOpenChange={setBrowserOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function RigSection() {
  const { brand, camera, lens, lensMountKey, compat } = useResolvedSelection();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <CameraRig
        brand={brand ? { brand: brand.brand, format: brand.format, mount: brand.mount } : null}
        camera={camera}
        lens={lens}
        lensMountKey={lensMountKey}
        compat={compat}
      />
    </motion.div>
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
