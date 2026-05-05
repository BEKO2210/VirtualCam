import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
  CameraBrand,
  CameraModel,
  GenreTemplate,
  Lens,
  RawData,
  Settings,
} from '@/types';
import {
  annotateLensesForBrand,
  checkMountCompat,
  findCamera,
  findLensAcrossMounts,
  generatePrompt,
  getApertureForLens,
  pickRandomSetup,
  type AnnotatedLens,
} from './engine';

const STORAGE_KEY = 'cpp:setup:v1';

interface PersistedSetup {
  brandKey: string | null;
  cameraId: string | null;
  lensId: string | null;
  lensMountKey: string | null;
  genreKey: string | null;
  settings: Settings;
  history: Array<{
    id: string;
    label: string;
    at: number;
    brandKey: string;
    cameraId: string;
    lensId: string;
    lensMountKey: string;
    genreKey: string;
  }>;
  favorites: string[];
}

const emptyPersist: PersistedSetup = {
  brandKey: null,
  cameraId: null,
  lensId: null,
  lensMountKey: null,
  genreKey: null,
  settings: {},
  history: [],
  favorites: [],
};

function loadPersist(): PersistedSetup {
  if (typeof window === 'undefined') return emptyPersist;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return emptyPersist;
    return { ...emptyPersist, ...JSON.parse(s) };
  } catch {
    return emptyPersist;
  }
}

function savePersist(p: PersistedSetup) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export interface StudioState extends PersistedSetup {
  raw: RawData | null;
  loading: boolean;
  error: string | null;

  /* derived caches */
  promptText: string;
  promptTokens: Array<{ start: number; end: number; key: string; value: string }>;

  /* setters */
  setRaw: (r: RawData) => void;
  setError: (e: string | null) => void;

  setBrand: (key: string | null) => void;
  setCamera: (id: string | null) => void;
  setLens: (mountKey: string, lensId: string) => void;
  setGenre: (key: string | null) => void;
  setSettings: (patch: Settings) => void;
  resetSettings: () => void;

  randomize: () => void;
  saveToHistory: (label?: string) => void;
  toggleFavorite: (id: string) => void;
}

const recompute = (state: StudioState): Pick<StudioState, 'promptText' | 'promptTokens'> => {
  if (!state.raw) return { promptText: '', promptTokens: [] };
  const brand = state.brandKey ? state.raw.cameras[state.brandKey] ?? null : null;
  const camera = brand && state.cameraId ? findCamera(state.raw, brand.key, state.cameraId) : null;
  const lensRef = state.lensMountKey && state.lensId
    ? findLensAcrossMounts(state.raw, state.lensId)
    : null;
  const genre = state.genreKey ? state.raw.templates[state.genreKey] ?? null : null;
  const r = generatePrompt({
    brand,
    camera,
    lens: lensRef?.lens ?? null,
    genre,
    settings: state.settings,
  });
  return { promptText: r.text, promptTokens: r.tokens };
};

export const useStudio = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    ...loadPersist(),
    raw: null,
    loading: true,
    error: null,
    promptText: '',
    promptTokens: [],

    setRaw: (r) => {
      set({ raw: r, loading: false });
      // recompute on data load (in case persisted setup is restored)
      set((s) => recompute(s));
    },
    setError: (error) => set({ error, loading: false }),

    setBrand: (key) => {
      const raw = get().raw;
      // If brand changes, drop camera & lens (they belong to brand context).
      const brand = key && raw ? raw.cameras[key] : null;
      const firstModel = brand?.models[0]?.id ?? null;
      set((s) => {
        const next = {
          ...s,
          brandKey: key,
          cameraId: firstModel,
          lensId: null,
          lensMountKey: null,
        };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    setCamera: (id) => {
      set((s) => {
        const next = { ...s, cameraId: id };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    setLens: (mountKey, lensId) => {
      const raw = get().raw;
      const genre = get().genreKey && raw ? raw.templates[get().genreKey!] : null;
      const lens = raw?.lenses[mountKey]?.lenses.find((l) => l.id === lensId) ?? null;
      // Auto-suggest aperture from lens × genre bias.
      const bias = genre?.defaults?.aperture ? 0.7 : 0.4;
      const aperture = lens ? getApertureForLens(lens.max_aperture, bias) : undefined;
      set((s) => {
        const next: StudioState = {
          ...s,
          lensId,
          lensMountKey: mountKey,
          settings: aperture ? { ...s.settings, aperture } : s.settings,
        };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    setGenre: (key) => {
      const raw = get().raw;
      const tpl = key && raw ? raw.templates[key] : null;
      set((s) => {
        const merged: Settings = { ...s.settings };
        if (tpl?.defaults) {
          for (const [k, v] of Object.entries(tpl.defaults)) {
            const camel = k.replace(/_(\w)/g, (_, c) => c.toUpperCase());
            if (!merged[camel as keyof Settings]) merged[camel as keyof Settings] = v;
          }
        }
        const next: StudioState = { ...s, genreKey: key, settings: merged };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    setSettings: (patch) => {
      set((s) => {
        const next = { ...s, settings: { ...s.settings, ...patch } };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    resetSettings: () => {
      set((s) => {
        const next = { ...s, settings: {} };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    randomize: () => {
      const raw = get().raw;
      if (!raw) return;
      const pick = pickRandomSetup(raw);
      const tpl = raw.templates[pick.genreKey];
      const lens = raw.lenses[pick.lensMountKey]?.lenses.find((l) => l.id === pick.lensId);
      set((s) => {
        const merged: Settings = {};
        if (tpl?.defaults) {
          for (const [k, v] of Object.entries(tpl.defaults)) {
            const camel = k.replace(/_(\w)/g, (_, c) => c.toUpperCase());
            merged[camel as keyof Settings] = v;
          }
        }
        if (lens) merged.aperture = getApertureForLens(lens.max_aperture, 0.7);
        const next: StudioState = {
          ...s,
          brandKey: pick.brandKey,
          cameraId: pick.cameraId,
          lensId: pick.lensId,
          lensMountKey: pick.lensMountKey,
          genreKey: pick.genreKey,
          settings: merged,
        };
        return { ...next, ...recompute(next) };
      });
      persistFromState(get());
    },

    saveToHistory: (label) => {
      set((s) => {
        if (!s.brandKey || !s.cameraId || !s.lensId || !s.lensMountKey || !s.genreKey) return s;
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const entry = {
          id,
          label: label ?? `${s.brandKey} · ${s.genreKey}`,
          at: Date.now(),
          brandKey: s.brandKey,
          cameraId: s.cameraId,
          lensId: s.lensId,
          lensMountKey: s.lensMountKey,
          genreKey: s.genreKey,
        };
        return { ...s, history: [entry, ...s.history].slice(0, 30) };
      });
      persistFromState(get());
    },

    toggleFavorite: (id) => {
      set((s) => ({
        ...s,
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((x) => x !== id)
          : [...s.favorites, id].slice(-200),
      }));
      persistFromState(get());
    },
  })),
);

function persistFromState(s: StudioState) {
  savePersist({
    brandKey: s.brandKey,
    cameraId: s.cameraId,
    lensId: s.lensId,
    lensMountKey: s.lensMountKey,
    genreKey: s.genreKey,
    settings: s.settings,
    history: s.history,
    favorites: s.favorites,
  });
}

/* ──────────────────────────────────────────────────────────────
 * Selectors – atomic + derived (memoized via useShallow)
 * ────────────────────────────────────────────────────────────── */

export const useRaw = () => useStudio((s) => s.raw);

export const useSelection = () =>
  useStudio(
    useShallow((s) => ({
      brandKey: s.brandKey,
      cameraId: s.cameraId,
      lensId: s.lensId,
      lensMountKey: s.lensMountKey,
      genreKey: s.genreKey,
    })),
  );

export const useResolvedSelection = () =>
  useStudio(
    useShallow((s) => {
      const brand: CameraBrand | null = s.raw && s.brandKey ? s.raw.cameras[s.brandKey] ?? null : null;
      const camera: CameraModel | null = brand && s.cameraId ? findCamera(s.raw!, brand.key, s.cameraId) : null;
      const lensRef = s.lensId && s.lensMountKey && s.raw ? findLensAcrossMounts(s.raw, s.lensId) : null;
      const lens: Lens | null = lensRef?.lens ?? null;
      const lensMountKey = lensRef?.mountKey ?? s.lensMountKey ?? null;
      const genre: GenreTemplate | null = s.raw && s.genreKey ? s.raw.templates[s.genreKey] ?? null : null;
      const compat = brand && lensMountKey ? checkMountCompat(brand.key, lensMountKey) : null;
      return { brand, camera, lens, lensMountKey, genre, compat };
    }),
  );

export const usePrompt = () =>
  useStudio(useShallow((s) => ({ text: s.promptText, tokens: s.promptTokens })));

/** Compatibility-annotated lens list for the active brand */
export function useCompatibleLenses(): AnnotatedLens[] {
  return useStudio(
    useShallow((s) => {
      if (!s.raw || !s.brandKey) return [];
      return annotateLensesForBrand(s.brandKey, s.raw);
    }),
  );
}
