import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatThousands(n: number, locale: string = 'de-DE') {
  return n.toLocaleString(locale);
}

export function isoLabel(iso: number) {
  return iso >= 1000 ? formatThousands(iso) : String(iso);
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let h: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => fn(...args), ms);
  };
}
