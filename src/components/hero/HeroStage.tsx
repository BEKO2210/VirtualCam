import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSelection } from '@/lib/store';
import { Breadcrumb, type StageKey } from './Breadcrumb';
import { PickBrand } from './PickBrand';
import { PickCamera } from './PickCamera';
import { PickLens } from './PickLens';
import { PickGenre } from './PickGenre';
import { RigView } from './RigView';

/**
 * The hero is a finite-state machine over five stages. Per @beko's
 * request, every fresh visit starts at step 1 ("brand") instead of
 * resuming from the persisted setup.
 */
export function HeroStage() {
  const sel = useSelection();
  const [stage, setStage] = useState<StageKey>('brand');

  // If the selection ever drops back below the current stage's
  // requirements (e.g. user clears brand from the Sheet), retreat.
  useEffect(() => {
    if (!sel.brandKey && stage !== 'brand') setStage('brand');
    if (!sel.cameraId && (stage === 'lens' || stage === 'genre' || stage === 'rig')) {
      setStage(sel.brandKey ? 'camera' : 'brand');
    }
  }, [sel.brandKey, sel.cameraId, stage]);

  const steps = [
    { key: 'brand' as const, label: 'Marke', done: !!sel.brandKey, enabled: true },
    { key: 'camera' as const, label: 'Kamera', done: !!sel.cameraId, enabled: !!sel.brandKey },
    { key: 'lens' as const, label: 'Objektiv', done: !!sel.lensId, enabled: !!sel.cameraId },
    { key: 'genre' as const, label: 'Genre', done: !!sel.genreKey, enabled: !!sel.lensId },
    { key: 'rig' as const, label: 'Rig', done: !!(sel.brandKey && sel.cameraId && sel.lensId && sel.genreKey), enabled: !!(sel.brandKey && sel.cameraId) },
  ];

  return (
    <section className="glass-strong rounded-[var(--radius-lg)] p-3 sm:p-4 space-y-3">
      <Breadcrumb stage={stage} steps={steps} onJump={setStage} />
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
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

