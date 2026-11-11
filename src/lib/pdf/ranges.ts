import { PdfProcessError } from '@/lib/pdf/document';

/** Parse 1-based page range strings like "1-3, 5, 7-10". */
export function parseRanges(input: string, max: number): number[][] {
  const ranges: number[][] = [];
  if (!input.trim()) return ranges;
  for (const part of input.split(',')) {
    const trimmed = part.trim();
    if (!/^\d+(?:-\d+)?$/.test(trimmed)) {
      throw new PdfProcessError('Use page numbers or ranges like 1-3, 5, 7-10.');
    }
    const [first, last = first] = trimmed.split('-').map(Number);
    if (first < 1 || last < 1 || first > max || last > max) {
      throw new PdfProcessError(`Page numbers must be between 1 and ${max}.`);
    }
    ranges.push([Math.min(first, last), Math.max(first, last)]);
  }
  return ranges;
}

export function rangesToIndices(ranges: number[][]): number[] {
  const set = new Set<number>();
  for (const [lo, hi] of ranges) {
    for (let p = lo; p <= hi; p++) set.add(p - 1);
  }
  return [...set].sort((a, b) => a - b);
}
