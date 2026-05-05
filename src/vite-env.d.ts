/// <reference types="vite/client" />

declare module '*.css';
declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '@leeoniya/ufuzzy' {
  export interface Info {
    idx: number[];
    start: number[];
    chars: number[];
    terms: number[];
    interLft2: number[];
    interLft1: number[];
    interRgt2: number[];
    interRgt1: number[];
    interIns: number[];
    intraIns: number[];
    ranges?: number[][];
  }
  export interface Options {
    intraMode?: 0 | 1;
    intraIns?: number;
    intraSub?: number;
    intraTrn?: number;
    intraDel?: number;
    interIns?: number;
    interLft?: number;
    interRgt?: number;
    interChars?: string;
    intraChars?: string;
    intraSplit?: string;
    interSplit?: string;
    interBound?: string;
    intraBound?: string;
  }
  export default class uFuzzy {
    constructor(opts?: Options);
    search(
      haystack: string[],
      needle: string,
      outOfOrder?: 0 | 1,
      infoThresh?: number,
    ): [number[] | null, Info | undefined, number[] | undefined];
    filter(haystack: string[], needle: string): number[] | null;
  }
}
