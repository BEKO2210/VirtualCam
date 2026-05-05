import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSelection } from '@/lib/store';
import { Breadcrumb, type StageKey } from './Breadcrumb';
import { PickBrand } from './PickBrand';
import { PickCamera } from './PickCamera';
import { PickLens } from './PickLens';
import { PickGenre } from './PickGenre';
import { RigView } from './RigView';

const STAGE_INDEX: Record<StageKey, number> = {
  brand: 0,
  camera: 1,
  lens: 2,
  genre: 3,
  rig: 4,
};

/**
 * The hero is a finite-state machine over five stages. Per @beko's
 * request, every fresh visit starts at step 1 ("brand") instead of
 * resuming from the persisted setup. On every stage change we also
 * scroll the page to the top of the hero so the new content is
 * immediately visible.
 */
export function HeroStage() {
  const sel = useSelection();
  const [stage, setStage] = useState<StageKey>('brand');
  const prevStageRef = useRef<StageKey>('brand');
  const heroRef = useRef<HTMLElement>(null);

  // If the selection ever drops back below the current stage's
  // requirements (e.g. user clears brand from the Sheet), retreat.
  useEffect(() => {
    if (!sel.brandKey && stage !== 'brand') setStage('brand');
    if (!sel.cameraId && (stage === 'lens' || stage === 'genre' || stage === 'rig')) {
      setStage(sel.brandKey ? 'camera' : 'brand');
    }
  }, [sel.brandKey, sel.cameraId, stage]);

  // Scroll to top of hero on every stage change.
  useEffect(() => {
    if (prevStageRef.current === stage) return;
    prevStageRef.current = stage;
    // Use rAF so the DOM has the new node before we measure.
    requestAnimationFrame(() => {
      const el = heroRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, [stage]);

  const steps = [
    { key: 'brand' as const, label: 'Marke', done: !!sel.brandKey, enabled: true },
    { key: 'camera' as const, label: 'Kamera', done: !!sel.cameraId, enabled: !!sel.brandKey },
    { key: 'lens' as const, label: 'Objektiv', done: !!sel.lensId, enabled: !!sel.cameraId },
    { key: 'genre' as const, label: 'Genre', done: !!sel.genreKey, enabled: !!sel.lensId },
    {
      key: 'rig' as const,
      label: 'Rig',
      done: !!(sel.brandKey && sel.cameraId && sel.lensId && sel.genreKey),
      enabled: !!(sel.brandKey && sel.cameraId),
    },
  ];

  // Slide direction: forward = swipe in from right, backward = from left.
  const dir = STAGE_INDEX[stage] >= STAGE_INDEX[prevStageRef.current] ? 1 : -1;

  return (
    <section
      ref={heroRef}
      className="glass-strong rounded-[var(--radius-lg)] p-3 sm:p-4 space-y-3 relative overflow-hidden"
    >
      {/* Ambient stage glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
      />
      <div className="relative">
        <Breadcrumb stage={stage} steps={steps} onJump={setStage} />
      </div>
      <div className="relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stage}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dir * 24 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={stage === 'rig' ? '' : 'min-h-[280px]'}
          >
            {stage === 'brand' && (
              <PickBrand active={sel.brandKey} onPicked={() => setStage('camera')} />
            )}
            {stage === 'camera' && (
              <PickCamera onPicked={() => setStage('lens')} onBack={() => setStage('brand')} />
            )}
            {stage === 'lens' && (
              <PickLens onPicked={() => setStage('genre')} onBack={() => setStage('camera')} />
            )}
            {stage === 'genre' && (
              <PickGenre onPicked={() => setStage('rig')} onBack={() => setStage('lens')} />
            )}
            {stage === 'rig' && <RigView onEdit={() => setStage('brand')} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
