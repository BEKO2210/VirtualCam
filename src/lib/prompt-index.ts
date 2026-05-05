import uFuzzy from '@leeoniya/ufuzzy';
import type { PromptEntry } from '@/types';

/**
 * Lazy-built fuzzy index over the (potentially) 10k+ prompts.
 * Builds a single haystack array and a side-table of facet tags
 * for O(1) genre/brand filtering before fuzzy ranking.
 */
export interface PromptIndex {
  haystack: string[];
  prompts: PromptEntry[];
  byGenre: Map<string, number[]>;
  byBrand: Map<string, number[]>;
  fuzzy: uFuzzy;
}

export function buildIndex(prompts: PromptEntry[]): PromptIndex {
  const haystack = new Array<string>(prompts.length);
  const byGenre = new Map<string, number[]>();
  const byBrand = new Map<string, number[]>();
  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    haystack[i] = `${p.metadata.genre_name ?? p.metadata.genre} · ${p.metadata.camera} · ${p.metadata.lens} · ${p.prompt.slice(0, 200)}`;
    const g = p.metadata.genre;
    const b = p.metadata.camera_brand;
    if (g) {
      let arr = byGenre.get(g);
      if (!arr) byGenre.set(g, (arr = []));
      arr.push(i);
    }
    if (b) {
      let arr = byBrand.get(b);
      if (!arr) byBrand.set(b, (arr = []));
      arr.push(i);
    }
  }
  const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 1, interIns: Infinity });
  return { haystack, prompts, byGenre, byBrand, fuzzy };
}

export interface SearchResult {
  index: number;
  ranges?: number[];
}

/**
 * Searches the index with optional facet filters.
 * Returns up to `limit` results (default 200). Caller handles virtualization.
 */
export function searchPrompts(
  idx: PromptIndex,
  query: string,
  filters: { genre?: string; brand?: string } = {},
  limit = 500,
): SearchResult[] {
  // Build the candidate set via facet intersection.
  let candidates: number[] | null = null;
  if (filters.genre && idx.byGenre.has(filters.genre)) {
    candidates = idx.byGenre.get(filters.genre)!.slice();
  }
  if (filters.brand && idx.byBrand.has(filters.brand)) {
    const arr = idx.byBrand.get(filters.brand)!;
    if (candidates) {
      const set = new Set(arr);
      candidates = candidates.filter((i) => set.has(i));
    } else {
      candidates = arr.slice();
    }
  }

  if (!query.trim()) {
    const slice = candidates ?? null;
    if (slice) return slice.slice(0, limit).map((index) => ({ index }));
    return Array.from({ length: Math.min(limit, idx.prompts.length) }, (_, i) => ({ index: i }));
  }

  // ufuzzy returns indices into haystack. If we have a candidate list,
  // we run search on the full haystack and then intersect.
  const [, info, order] = idx.fuzzy.search(idx.haystack, query, 0, 1e3);
  if (!info || !order) return [];
  const cset = candidates ? new Set(candidates) : null;
  const results: SearchResult[] = [];
  for (let n = 0; n < order.length && results.length < limit; n++) {
    const ix = info.idx[order[n]];
    if (cset && !cset.has(ix)) continue;
    results.push({ index: ix, ranges: info.ranges?.[order[n]] });
  }
  return results;
}
