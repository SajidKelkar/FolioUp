import { PDFDocument, PageSizes, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { loadPdf, savePdf, PdfProcessError, isPdfMagic } from '@/lib/pdf/document';
import { parseRanges, rangesToIndices } from '@/lib/pdf/ranges';

export interface ProcessResult {
  blob: Blob;
  outputName: string;
  outputSize: number;
  meta?: Record<string, string | number>;
}

export const compressionPresets = [
  { level: 'basic', targetReduction: 10, quality: 0.96, minScale: 0.75, maxScale: 2.25 },
  { level: 'medium', targetReduction: 20, quality: 0.86, minScale: 0.65, maxScale: 1.8 },
  { level: 'extreme', targetReduction: 50, quality: 0.7, minScale: 0.5, maxScale: 1.8 },
] as const;
const maxImagePixels = 40_000_000;

export interface ProcessContext {
  onProgress?: (stage: string, percent?: number) => void;
}

export type ProcessFn = (
  files: File[],
  config: Record<string, string>,
  ctx: ProcessContext,
) => Promise<ProcessResult>;

async function readPdfFile(file: File) {
  const bytes = await file.arrayBuffer();
  if (!isPdfMagic(bytes)) {
    throw new PdfProcessError(`"${file.name}" is not a valid PDF (missing %PDF header).`);
  }
  return { bytes, doc: await loadPdf(bytes) };
}

function measureStandardFontText(
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  text: string,
  size: number,
): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    throw new PdfProcessError('Some characters in this text cannot be rendered by the built-in PDF font.');
  }
}

export async function processMerge(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  if (files.length < 2) throw new PdfProcessError('Merge needs at least two PDF files.');
  ctx.onProgress?.('Reading files', 8);
  const merged = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    ctx.onProgress?.(`Adding ${files[i].name}`, 10 + (i / files.length) * 80);
    const { doc } = await readPdfFile(files[i]);
    const copied = await merged.copyPages(doc, doc.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }
  ctx.onProgress?.('Saving', 95);
  const saved = await savePdf(merged, 'merged.pdf');
  return {
    blob: saved.blob,
    outputName: saved.outputName,
    outputSize: saved.outputSize,
    meta: { pages: merged.getPageCount(), files: files.length },
  };
}

export async function processSplit(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 12);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const ranges = parseRanges(config.ranges || '1', total);
  if (ranges.length === 0) {
    throw new PdfProcessError('No valid page ranges provided. Example: 1-3, 5, 7-10');
  }
  const zip = new JSZip();
  for (let i = 0; i < ranges.length; i++) {
    ctx.onProgress?.('Creating split files', 30 + (i / ranges.length) * 55);
    const [lo, hi] = ranges[i];
    const out = await PDFDocument.create();
    const indices = [];
    for (let p = lo - 1; p < hi; p++) indices.push(p);
    const pages = await out.copyPages(doc, indices);
    pages.forEach((page) => out.addPage(page));
    zip.file(`split_${i + 1}_pages_${lo === hi ? lo : `${lo}-${hi}`}.pdf`, await out.save());
  }
  ctx.onProgress?.('Packaging ZIP', 94);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return {
    blob: zipBlob,
    outputName: 'split_pdf.zip',
    outputSize: zipBlob.size,
    meta: { parts: ranges.length, totalPages: total },
  };
}

export async function processExtract(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const indices = rangesToIndices(parseRanges(config.pages || '1', total));
  if (indices.length === 0) throw new PdfProcessError('No valid pages to extract. Example: 1-3, 5');
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, indices);
  pages.forEach((page) => out.addPage(page));
  ctx.onProgress?.('Saving', 90);
  const saved = await savePdf(out, 'extracted.pdf');
  return { ...saved, meta: { pages: indices.length, totalPages: total } };
}

export async function processRotate(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const angleValue = config.angle || '90';
  if (!['90', '180', '270'].includes(angleValue)) {
    throw new PdfProcessError('Choose a rotation angle of 90, 180, or 270 degrees.');
  }
  const angle = Number(angleValue);
  ctx.onProgress?.('Rotating pages', 55);
  doc.getPages().forEach((page) => {
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  });
  ctx.onProgress?.('Saving', 90);
  return savePdf(doc, 'rotated.pdf');
}

export async function processDeletePages(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const toDelete = new Set(rangesToIndices(parseRanges(config.pages || '', total)));
  if (toDelete.size === 0) throw new PdfProcessError('No valid pages specified. Example: 3, 5, 8-10');
  const keep = doc.getPageIndices().filter((i) => !toDelete.has(i));
  if (keep.length === 0) throw new PdfProcessError('Cannot delete all pages — a PDF must keep at least one page.');
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, keep);
  pages.forEach((page) => out.addPage(page));
  ctx.onProgress?.('Saving', 88);
  return savePdf(out, 'cleaned.pdf');
}

export async function processOrganize(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const entries = (config.order || '').split(',').map((entry) => entry.trim());
  if (
    entries.length === 0 ||
    entries.some((entry) => !/^\d+$/.test(entry) || Number(entry) < 1 || Number(entry) > total)
  ) {
    throw new PdfProcessError(`Enter a page order using numbers from 1 to ${total}, such as 3,1,2,4.`);
  }
  const order = entries.map((entry) => Number(entry) - 1);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, order);
  pages.forEach((page) => out.addPage(page));
  ctx.onProgress?.('Saving', 88);
  return savePdf(out, 'organized.pdf');
}

export async function processReverse(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 20);
  const { doc } = await readPdfFile(files[0]);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, [...doc.getPageIndices()].reverse());
  pages.forEach((page) => out.addPage(page));
  ctx.onProgress?.('Saving', 88);
  return savePdf(out, 'reversed.pdf');
}

export async function processDuplicate(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const targets = new Set(rangesToIndices(parseRanges(config.pages || '1', total)));
  if (targets.size === 0) throw new PdfProcessError('Specify pages to duplicate. Example: 1, 3');
  const out = await PDFDocument.create();
  for (let i = 0; i < total; i++) {
    const [page] = await out.copyPages(doc, [i]);
    out.addPage(page);
    if (targets.has(i)) {
      const [dup] = await out.copyPages(doc, [i]);
      out.addPage(dup);
    }
  }
  ctx.onProgress?.('Saving', 90);
  return savePdf(out, 'duplicated.pdf');
}

export async function processInsertBlank(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const total = doc.getPageCount();
  const afterValue = config.after?.trim() || '0';
  const countValue = config.count?.trim() || '1';
  if (!/^\d+$/.test(afterValue) || !/^\d+$/.test(countValue)) {
    throw new PdfProcessError('Insertion position and page count must be whole numbers.');
  }
  const after = Number(afterValue);
  const count = Number(countValue);
  if (!Number.isInteger(after) || after < 0 || after > total) {
    throw new PdfProcessError(`Choose an insertion position from 0 to ${total}.`);
  }
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new PdfProcessError('Choose between 1 and 20 blank pages.');
  }
  const first = doc.getPages()[0];
  const size = first.getSize();
  const insertAt = after;
  for (let i = 0; i < count; i++) {
    doc.insertPage(insertAt + i, [size.width, size.height]);
  }
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'with_blank_pages.pdf');
}

export async function processCrop(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const margin = Number(config.margin || '36');
  if (!Number.isFinite(margin) || margin < 0) {
    throw new PdfProcessError('Enter a valid non-negative margin in points.');
  }
  ctx.onProgress?.('Cropping pages', 50);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const w = width - margin * 2;
    const h = height - margin * 2;
    if (w <= 0 || h <= 0) {
      throw new PdfProcessError('The margin is too large for one or more pages.');
    }
    page.setCropBox(margin, margin, w, h);
    page.setMediaBox(margin, margin, w, h);
  }
  ctx.onProgress?.('Saving', 90);
  return savePdf(doc, 'cropped.pdf');
}

function copyDocumentMetadata(source: PDFDocument, target: PDFDocument) {
  const title = source.getTitle();
  const author = source.getAuthor();
  const subject = source.getSubject();
  const keywords = source.getKeywords();
  const creator = source.getCreator();
  const producer = source.getProducer();
  const creationDate = source.getCreationDate();
  const modificationDate = source.getModificationDate();

  if (title) target.setTitle(title);
  if (author) target.setAuthor(author);
  if (subject) target.setSubject(subject);
  if (keywords) target.setKeywords(keywords.split(/\s+/).filter(Boolean));
  if (creator) target.setCreator(creator);
  if (producer) target.setProducer(producer);
  if (creationDate) target.setCreationDate(creationDate);
  if (modificationDate) target.setModificationDate(modificationDate);
}

async function rewriteDocument(doc: PDFDocument) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, doc.getPageIndices());
  pages.forEach((page) => out.addPage(page));
  copyDocumentMetadata(doc, out);
  return out;
}

async function rasterizeToPdf(
  bytes: ArrayBuffer,
  scale: number,
  quality: number,
  ctx: ProcessContext,
  source: PDFDocument,
) {
  const { openPdfJs, renderPageToBlob } = await import('@/lib/pdf/render');
  const pdf = await openPdfJs(bytes.slice(0));
  try {
    return await rasterizePdfDocument(pdf, scale, quality, ctx, source, renderPageToBlob);
  } finally {
    await pdf.destroy();
  }
}

async function rasterizePdfDocument(
  pdf: Awaited<ReturnType<typeof import('@/lib/pdf/render').openPdfJs>>,
  scale: number,
  quality: number,
  ctx: ProcessContext,
  source: PDFDocument,
  renderPageToBlob: typeof import('@/lib/pdf/render').renderPageToBlob,
) {
  const out = await PDFDocument.create();
  copyDocumentMetadata(source, out);
  for (let i = 1; i <= pdf.numPages; i++) {
    ctx.onProgress?.(`Rendering page ${i} of ${pdf.numPages}`, 15 + (i / pdf.numPages) * 70);
    const sourcePage = await pdf.getPage(i);
    try {
      const { width, height } = sourcePage.getViewport({ scale: 1 });
      const { blob } = await renderPageToBlob(pdf, i, {
        scale,
        mime: 'image/jpeg',
        quality,
      });
      const jpg = await out.embedJpg(await blob.arrayBuffer());
      const page = out.addPage([width, height]);
      page.drawImage(jpg, { x: 0, y: 0, width, height });
    } finally {
      sourcePage.cleanup();
    }
  }
  return out;
}

async function createCompressionCandidate(
  originalSize: number,
  preset: (typeof compressionPresets)[number],
  renderCandidate: (scale: number) => Promise<PDFDocument>,
) {
  const targetSize = originalSize * (1 - preset.targetReduction / 100);
  const minScale = preset.minScale;
  const maxScale = preset.maxScale;
  let scale = Math.min(maxScale, Math.max(minScale, 1));
  let best: { doc: PDFDocument; output: Awaited<ReturnType<typeof savePdf>>; difference: number } | undefined;

  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await renderCandidate(scale);
    const output = await savePdf(doc, 'compressed.pdf', true);
    const difference = Math.abs(output.outputSize - targetSize);
    if (!best || difference < best.difference) best = { doc, output, difference };
    if (difference <= Math.max(1024, targetSize * 0.015)) break;

    const scaleFactor = Math.sqrt(targetSize / Math.max(1, output.outputSize));
    const nextScale = Math.min(maxScale, Math.max(minScale, scale * scaleFactor));
    if (Math.abs(nextScale - scale) < 0.02) break;
    scale = nextScale;
  }

  if (!best) throw new PdfProcessError('Could not create a compression estimate for this PDF.');
  return best;
}

function compressionResult(
  file: File,
  preset: (typeof compressionPresets)[number],
  candidate: Awaited<ReturnType<typeof createCompressionCandidate>>,
): ProcessResult {
  const noSavings = candidate.output.outputSize >= file.size;
  const output = noSavings
    ? { blob: file, outputName: file.name, outputSize: file.size }
    : candidate.output;
  return {
    blob: output.blob,
    outputName: output.outputName,
    outputSize: output.outputSize,
    meta: {
      originalSize: file.size,
      level: preset.level,
      targetReduction: preset.targetReduction,
      method: noSavings ? 'original-retained-no-savings' : `lossy-raster-jpeg-${preset.level}`,
      pages: candidate.doc.getPageCount(),
    },
  };
}

export async function processCompress(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 8);
  const { bytes, doc } = await readPdfFile(files[0]);
  const level = config.level || 'basic';
  const preset = compressionPresets.find((option) => option.level === level);
  if (!preset) {
    throw new PdfProcessError('Choose Basic, Medium, or Extreme compression.');
  }
  const originalSize = files[0].size;

  ctx.onProgress?.('Rendering pages for compression', 20);
  const candidate = await createCompressionCandidate(originalSize, preset, (scale) =>
    rasterizeToPdf(bytes, scale, preset.quality, ctx, doc),
  );
  const result = compressionResult(files[0], preset, candidate);
  if (result.meta?.method === 'original-retained-no-savings') {
    ctx.onProgress?.('Keeping original because compression did not reduce size', 96);
  }
  return result;
}

export async function processOptimize(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 10);
  const { doc } = await readPdfFile(files[0]);
  const rewritten = await rewriteDocument(doc);
  ctx.onProgress?.('Saving optimized candidate', 75);
  const candidate = await savePdf(rewritten, 'optimized.pdf', true);
  const retainedOriginal = candidate.outputSize >= files[0].size;
  const output = retainedOriginal
    ? { blob: files[0], outputName: files[0].name, outputSize: files[0].size }
    : candidate;
  return {
    ...output,
    meta: {
      originalSize: files[0].size,
      pages: doc.getPageCount(),
      method: retainedOriginal ? 'original-retained-no-savings' : 'pdf-structure-rewrite',
    },
  };
}

export async function processFlatten(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 18);
  const { doc } = await readPdfFile(files[0]);
  const form = doc.getForm();
  if (form.getFields().length > 0) {
    ctx.onProgress?.('Flattening form fields', 50);
    form.flatten();
  }
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'flattened.pdf');
}

export async function processRemoveMetadata(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 18);
  const { doc } = await readPdfFile(files[0]);
  ctx.onProgress?.('Removing metadata', 50);
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setCreator('');
  doc.setProducer('');
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'clean.pdf');
}

export async function processImagesToPdf(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  if (files.length === 0) throw new PdfProcessError('Add at least one image.');
  ctx.onProgress?.('Creating PDF', 8);
  const doc = await PDFDocument.create();
  const pageSize = config.pageSize || 'fit';
  const orientation = config.orientation || 'auto';
  if (!['fit', 'a4', 'letter'].includes(pageSize)) {
    throw new PdfProcessError('Choose Fit to image, A4, or US Letter page size.');
  }
  if (!['auto', 'portrait', 'landscape'].includes(orientation)) {
    throw new PdfProcessError('Choose Auto, Portrait, or Landscape orientation.');
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    ctx.onProgress?.(`Adding ${file.name}`, 10 + (i / files.length) * 75);
    const imgBytes = await file.arrayBuffer();
    const header = new Uint8Array(imgBytes.slice(0, 8));
    const isPng =
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47;
    const isJpg = header[0] === 0xff && header[1] === 0xd8;
    if (!isPng && !isJpg) {
      throw new PdfProcessError(`"${file.name}" is not a JPG or PNG image.`);
    }
    const img = isPng ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);

    let pageW: number;
    let pageH: number;
    if (pageSize === 'fit') {
      pageW = img.width;
      pageH = img.height;
    } else {
      const preset = pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
      const landscape =
        orientation === 'landscape' || (orientation === 'auto' && img.width > img.height);
      pageW = landscape ? preset[1] : preset[0];
      pageH = landscape ? preset[0] : preset[1];
    }

    const page = doc.addPage([pageW, pageH]);
    if (pageSize === 'fit') {
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    } else {
      const margin = 30;
      const scale = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
    }
  }
  ctx.onProgress?.('Saving', 92);
  return savePdf(doc, 'images.pdf');
}

export async function processTextToPdf(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Creating PDF', 20);
  const text = files[0] ? await files[0].text() : '';
  if (!text.trim()) throw new PdfProcessError('Select a non-empty text file to convert.');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 11;
  const margin = 50;
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  let page = doc.addPage(PageSizes.A4);
  let y = pageHeight - margin;

  const drawLine = (line: string) => {
    if (y < margin) {
      page = doc.addPage(PageSizes.A4);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size, font, color: rgb(0.12, 0.16, 0.24) });
    y -= lineHeight;
  };
  const measure = (value: string) => {
    return measureStandardFontText(font, value, size);
  };

  const paragraphs = text.replace(/\r\n?/g, '\n').split('\n');
  for (const paragraph of paragraphs) {
    let line = '';
    const words = paragraph.split(/\s+/u).filter(Boolean);
    for (const word of words) {
      let remaining = word;
      while (remaining) {
        let chunk = '';
        for (const character of Array.from(remaining)) {
          const candidate = chunk + character;
          if (measure(candidate) > maxWidth) break;
          chunk = candidate;
        }
        if (!chunk) {
          throw new PdfProcessError('A character in this text cannot be rendered with the built-in PDF font.');
        }
        if (chunk.length < remaining.length) {
          if (line) {
            drawLine(line);
            line = '';
          }
          drawLine(chunk);
          remaining = remaining.slice(chunk.length);
          continue;
        }

        const next = line ? `${line} ${chunk}` : chunk;
        if (line && measure(next) > maxWidth) {
          drawLine(line);
          line = chunk;
        } else {
          line = next;
        }
        remaining = '';
      }
    }
    if (line) drawLine(line);
    else if (words.length === 0) y -= lineHeight;
  }
  ctx.onProgress?.('Saving', 90);
  return savePdf(doc, 'text.pdf');
}

export async function processPageNumbers(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const position = config.position || 'bottom-center';
  const startValue = config.start?.trim() || '1';
  if (!/^\d+$/.test(startValue) || Number(startValue) < 1 || !Number.isSafeInteger(Number(startValue))) {
    throw new PdfProcessError('Enter a positive whole number for the starting page number.');
  }
  const startNum = Number(startValue);
  ctx.onProgress?.('Adding page numbers', 45);
  doc.getPages().forEach((page, index) => {
    const num = String(startNum + index);
    const textWidth = font.widthOfTextAtSize(num, 11);
    const { width, height } = page.getSize();
    const margin = 30;
    const hAlign = position.split('-')[1] || 'center';
    const x = hAlign === 'left' ? margin : hAlign === 'right' ? width - margin - textWidth : (width - textWidth) / 2;
    const y = position.startsWith('bottom') ? margin : height - margin - 11;
    page.drawText(num, { x, y, size: 11, font, color: rgb(0.4, 0.4, 0.45) });
  });
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'numbered.pdf');
}

export async function processHeadersFooters(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = (config.text || '').trim();
  if (!text) throw new PdfProcessError('Enter the header or footer text.');
  if (text.length > 120) throw new PdfProcessError('Header or footer text must be 120 characters or fewer.');
  measureStandardFontText(font, text, 10);

  const position = config.position || 'bottom-center';
  if (!['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].includes(position)) {
    throw new PdfProcessError('Choose a valid header or footer position.');
  }

  ctx.onProgress?.('Adding headers and footers', 45);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const naturalTextWidth = font.widthOfTextAtSize(text, 10);
    const fontSize = Math.min(10, ((width - 60) / naturalTextWidth) * 10);
    if (fontSize < 6) {
      throw new PdfProcessError('Header or footer text is too long to fit on one or more pages.');
    }
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const alignment = position.split('-')[1];
    const x = alignment === 'left' ? 30 : alignment === 'right' ? width - 30 - textWidth : (width - textWidth) / 2;
    const y = position.startsWith('top') ? height - 30 - fontSize : 30;
    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.4, 0.4, 0.45) });
  }

  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'header-footer.pdf');
}

export async function processWatermark(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = (config.text ?? 'CONFIDENTIAL').trim();
  if (!text.trim()) throw new PdfProcessError('Enter the watermark text.');
  if (text.length > 80) throw new PdfProcessError('Watermark text must be 80 characters or fewer.');
  measureStandardFontText(font, text, 12);
  const configuredOpacity = Number(config.opacity ?? 20);
  if (!Number.isInteger(configuredOpacity) || configuredOpacity < 5 || configuredOpacity > 80) {
    throw new PdfProcessError('Choose a watermark opacity between 5% and 80%.');
  }
  const alpha = configuredOpacity / 100;
  ctx.onProgress?.('Adding watermark', 45);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 8;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.55),
      opacity: alpha,
      rotate: degrees(45),
    });
  });
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'watermarked.pdf');
}

export async function processAddText(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 15);
  const { doc } = await readPdfFile(files[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = (config.text || '').trim();
  if (!text) throw new PdfProcessError('Enter the text to add.');
  if (text.length > 200) throw new PdfProcessError('Text must be 200 characters or fewer.');
  measureStandardFontText(font, text, 14);
  const pageValue = config.page?.trim() || '1';
  if (!/^\d+$/.test(pageValue) || Number(pageValue) < 1) {
    throw new PdfProcessError('Enter a positive whole number for the page number.');
  }
  const pageIndex = Number(pageValue) - 1;
  const pages = doc.getPages();
  if (pageIndex >= pages.length) throw new PdfProcessError('That page number is outside this PDF.');
  const page = pages[pageIndex];
  const { width, height } = page.getSize();
  page.drawText(text.slice(0, 200), {
    x: 48,
    y: height - 64,
    size: 14,
    font,
    color: rgb(0.12, 0.16, 0.24),
    maxWidth: width - 96,
  });
  ctx.onProgress?.('Saving', 88);
  return savePdf(doc, 'annotated.pdf');
}

export async function processAddImageToPdf(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  if (files.length !== 2) {
    throw new PdfProcessError('Select exactly one PDF and one JPG or PNG image.');
  }

  ctx.onProgress?.('Checking PDF and image', 10);
  const fileBytes = await Promise.all(files.map((file) => file.arrayBuffer()));
  const pdfIndex = fileBytes.findIndex(isPdfMagic);
  if (pdfIndex < 0 || fileBytes.filter(isPdfMagic).length !== 1) {
    throw new PdfProcessError('Select exactly one valid PDF and one JPG or PNG image.');
  }
  const imageIndex = pdfIndex === 0 ? 1 : 0;
  const imageFile = files[imageIndex];
  const imageBytes = fileBytes[imageIndex];
  const isPng =
    imageFile.type === 'image/png' ||
    imageFile.name.toLowerCase().endsWith('.png');
  const isJpeg =
    imageFile.type === 'image/jpeg' ||
    imageFile.name.toLowerCase().endsWith('.jpg') ||
    imageFile.name.toLowerCase().endsWith('.jpeg');
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  const imageSignature = new Uint8Array(imageBytes.slice(0, 8));
  const isValidImage = isPng
    ? pngSignature.every((byte, index) => imageSignature[index] === byte)
    : isJpeg && imageSignature[0] === 255 && imageSignature[1] === 216 && imageSignature[2] === 255;
  if (!isValidImage) {
    throw new PdfProcessError('The image must be a valid JPG or PNG file.');
  }

  const { doc } = await readPdfFile(files[pdfIndex]);
  const pageValue = config.page?.trim() || '1';
  if (!/^\d+$/.test(pageValue) || Number(pageValue) < 1) {
    throw new PdfProcessError('Enter a positive whole number for the page number.');
  }
  const pageIndex = Number(pageValue) - 1;
  const pages = doc.getPages();
  if (pageIndex >= pages.length) throw new PdfProcessError('That page number is outside this PDF.');

  const configuredSize = Number(config.size || 25);
  if (!Number.isInteger(configuredSize) || configuredSize < 10 || configuredSize > 40) {
    throw new PdfProcessError('Choose an image width between 10% and 40%.');
  }
  const position = config.position || 'bottom-right';
  if (!['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].includes(position)) {
    throw new PdfProcessError('Choose a valid image position.');
  }

  ctx.onProgress?.('Adding image to PDF page', 55);
  const image = isPng
    ? await doc.embedPng(imageBytes)
    : await doc.embedJpg(imageBytes);
  const page = pages[pageIndex];
  const { width, height } = page.getSize();
  const margin = Math.min(24, width / 20, height / 20);
  const maxWidth = Math.min(width - margin * 2, width * configuredSize / 100);
  const maxHeight = Math.min(height - margin * 2, height * 0.4);
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = position.endsWith('left')
    ? margin
    : position.endsWith('right')
      ? width - margin - drawWidth
      : (width - drawWidth) / 2;
  const y = position.startsWith('top')
    ? height - margin - drawHeight
    : position.startsWith('bottom')
      ? margin
      : (height - drawHeight) / 2;
  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });

  ctx.onProgress?.('Saving', 90);
  const sourceName = files[pdfIndex].name.replace(/\.pdf$/i, '') || 'document';
  const outputName = `${sourceName}-stamped.pdf`;
  const saved = await savePdf(doc, outputName);
  return {
    ...saved,
    outputName,
    meta: { page: pageIndex + 1, position, imageWidthPercent: configuredSize },
  };
}

export async function processPageCount(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 30);
  const { doc } = await readPdfFile(files[0]);
  const info: Record<string, string | number> = {
    pages: doc.getPageCount(),
    fileSize: files[0].size,
    title: doc.getTitle() || '—',
    author: doc.getAuthor() || '—',
    creator: doc.getCreator() || '—',
    producer: doc.getProducer() || '—',
    creationDate: doc.getCreationDate()?.toISOString().split('T')[0] || '—',
  };
  ctx.onProgress?.('Done', 100);
  return { blob: new Blob(), outputName: 'info', outputSize: 0, meta: info };
}

export async function processImageCompress(
  files: File[],
  config: Record<string, string>,
  ctx: ProcessContext = {},
) {
  if (files.length === 0) throw new PdfProcessError('Choose at least one image to compress.');

  const format = config.format || 'webp';
  const outputFormats = {
    webp: { mime: 'image/webp', extension: 'webp' },
    jpeg: { mime: 'image/jpeg', extension: 'jpg' },
    png: { mime: 'image/png', extension: 'png' },
  } as const;
  const selectedFormat =
    format === 'webp' ? outputFormats.webp :
      format === 'jpeg' ? outputFormats.jpeg :
        format === 'png' ? outputFormats.png : undefined;
  if (!selectedFormat) throw new PdfProcessError('Choose WebP, JPEG, or PNG as the output format.');

  const quality = Number(config.quality ?? 80);
  if (format !== 'png' && (!Number.isFinite(quality) || quality < 10 || quality > 100)) {
    throw new PdfProcessError('Choose an image quality between 10% and 100%.');
  }

  const action = config.action === 'convert' ? 'converted' : 'compressed';
  const zip = files.length > 1 ? new JSZip() : null;
  let originalSize = 0;
  let compressedSize = 0;
  const outputNames = new Map<string, number>();

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const supportedType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const supportedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!supportedType && !supportedExtension) {
      throw new PdfProcessError(`"${file.name}" is not a supported JPEG, PNG, or WebP image.`);
    }

    ctx.onProgress?.(`${action === 'converted' ? 'Converting' : 'Compressing'} ${file.name}`, 10 + (index / files.length) * 75);
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new PdfProcessError(`"${file.name}" could not be opened as an image.`);
    }

    const canvas = document.createElement('canvas');
    try {
      if (bitmap.width * bitmap.height > maxImagePixels) {
        throw new PdfProcessError('This image is too large for browser compression. Resize it first, then try again.');
      }
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new PdfProcessError('Image compression is not supported in this browser.');

      if (format === 'jpeg') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new PdfProcessError('The browser could not encode this image.'));
          },
          selectedFormat.mime,
          format === 'png' ? undefined : quality / 100,
        );
      });
      if (blob.type !== selectedFormat.mime) {
        throw new PdfProcessError(`${selectedFormat.extension.toUpperCase()} output is not supported by this browser.`);
      }

      originalSize += file.size;
      compressedSize += blob.size;
      const stem = file.name.replace(/\.[^.]+$/, '') || `image-${index + 1}`;
      const duplicateCount = outputNames.get(stem) ?? 0;
      outputNames.set(stem, duplicateCount + 1);
      const uniqueStem = duplicateCount === 0 ? stem : `${stem}-${duplicateCount + 1}`;
      const outputName = `${uniqueStem}.${selectedFormat.extension}`;

      if (zip) zip.file(outputName, blob);
      else {
        ctx.onProgress?.('Done', 100);
        return {
          blob,
          outputName,
          outputSize: blob.size,
          meta: { images: 1, originalSize, compressedSize, format: selectedFormat.extension },
        };
      }
    } finally {
      bitmap.close();
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  ctx.onProgress?.('Packaging ZIP', 92);
  const blob = await zip!.generateAsync({ type: 'blob' });
  ctx.onProgress?.('Done', 100);
  return {
    blob,
    outputName: `${files.length}-${action}-images.zip`,
    outputSize: blob.size,
    meta: { images: files.length, originalSize, compressedSize, format: selectedFormat.extension },
  };
}

export async function processImageConvert(
  files: File[],
  config: Record<string, string>,
  ctx: ProcessContext = {},
) {
  return processImageCompress(files, { ...config, action: 'convert' }, ctx);
}

export async function processImageResize(
  files: File[],
  config: Record<string, string>,
  ctx: ProcessContext = {},
) {
  if (files.length === 0) throw new PdfProcessError('Choose at least one image to resize.');

  const maxWidth = Number(config.width ?? 1600);
  const maxHeight = Number(config.height ?? 1600);
  if (
    !Number.isInteger(maxWidth) || maxWidth < 1 || maxWidth > 12000 ||
    !Number.isInteger(maxHeight) || maxHeight < 1 || maxHeight > 12000
  ) {
    throw new PdfProcessError('Enter whole-number dimensions from 1 to 12000 pixels.');
  }

  const format = config.format ?? 'original';
  const quality = Number(config.quality ?? 85);
  if (!['original', 'webp', 'jpeg', 'png'].includes(format)) {
    throw new PdfProcessError('Choose original, WebP, JPEG, or PNG output.');
  }
  if (format !== 'png' && (!Number.isFinite(quality) || quality < 10 || quality > 100)) {
    throw new PdfProcessError('Choose an image quality between 10% and 100%.');
  }

  const zip = files.length > 1 ? new JSZip() : null;
  const outputNames = new Map<string, number>();
  let originalSize = 0;
  let outputSize = 0;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      throw new PdfProcessError(`"${file.name}" is not a supported JPEG, PNG, or WebP image.`);
    }

    ctx.onProgress?.(`Resizing ${file.name}`, 10 + (index / files.length) * 75);
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new PdfProcessError(`"${file.name}" could not be opened as an image.`);
    }

    const originalType = file.type || (
      /\.jpe?g$/i.test(file.name) ? 'image/jpeg' :
        /\.png$/i.test(file.name) ? 'image/png' : 'image/webp'
    );
    const requestedFormat = format === 'original'
      ? originalType === 'image/jpeg' ? 'jpeg' : originalType === 'image/png' ? 'png' : 'webp'
      : format;
    const outputFormats = {
      webp: { mime: 'image/webp', extension: 'webp' },
      jpeg: { mime: 'image/jpeg', extension: 'jpg' },
      png: { mime: 'image/png', extension: 'png' },
    } as const;
    const selectedFormat = outputFormats[requestedFormat as keyof typeof outputFormats];
    const pixelScale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
      Math.sqrt(maxImagePixels / (bitmap.width * bitmap.height)),
    );
    const width = Math.max(1, Math.round(bitmap.width * pixelScale));
    const height = Math.max(1, Math.round(bitmap.height * pixelScale));
    const canvas = document.createElement('canvas');

    try {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new PdfProcessError('Image resizing is not supported in this browser.');

      if (requestedFormat === 'jpeg') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new PdfProcessError('The browser could not encode this image.'));
          },
          selectedFormat.mime,
          requestedFormat === 'png' ? undefined : quality / 100,
        );
      });
      if (blob.type !== selectedFormat.mime) {
        throw new PdfProcessError(`${selectedFormat.extension.toUpperCase()} output is not supported by this browser.`);
      }

      originalSize += file.size;
      outputSize += blob.size;
      const stem = file.name.replace(/\.[^.]+$/, '') || `image-${index + 1}`;
      const duplicateCount = outputNames.get(stem) ?? 0;
      outputNames.set(stem, duplicateCount + 1);
      const uniqueStem = duplicateCount === 0 ? stem : `${stem}-${duplicateCount + 1}`;
      const outputName = `${uniqueStem}.${selectedFormat.extension}`;

      if (zip) zip.file(outputName, blob);
      else {
        ctx.onProgress?.('Done', 100);
        return {
          blob,
          outputName,
          outputSize: blob.size,
          meta: { images: 1, originalSize, resizedSize: outputSize, dimensions: `${width} × ${height} px`, format: selectedFormat.extension },
        };
      }
    } finally {
      bitmap.close();
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  ctx.onProgress?.('Packaging ZIP', 92);
  const blob = await zip!.generateAsync({ type: 'blob' });
  ctx.onProgress?.('Done', 100);
  return {
    blob,
    outputName: `${files.length}-resized-images.zip`,
    outputSize: blob.size,
    meta: { images: files.length, originalSize, resizedSize: outputSize, dimensions: 'Per image', format: format === 'original' ? 'original per image' : format },
  };
}

export async function processPdfToImages(files: File[], config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Reading PDF', 8);
  const { bytes, doc } = await readPdfFile(files[0]);
  const format = config.format === 'png' ? 'png' : 'jpg';
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const { openPdfJs, renderPageToBlob } = await import('@/lib/pdf/render');
  const pdf = await openPdfJs(bytes);
  const zip = new JSZip();
  const scale = parseFloat(config.scale || '2');
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      ctx.onProgress?.(`Rendering page ${i}`, 12 + (i / pdf.numPages) * 75);
      const { blob } = await renderPageToBlob(pdf, i, { scale, mime, quality: 0.86 });
      zip.file(`page-${String(i).padStart(3, '0')}.${format}`, blob);
    }
  } finally {
    await pdf.destroy();
  }
  ctx.onProgress?.('Packaging ZIP', 94);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return {
    blob: zipBlob,
    outputName: `pdf-pages.${format}.zip`,
    outputSize: zipBlob.size,
    meta: { pages: doc.getPageCount(), format },
  };
}

export async function processPdfToText(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Extracting text', 20);
  const { bytes } = await readPdfFile(files[0]);
  const { extractPdfText } = await import('@/lib/pdf/render');
  const text = await extractPdfText(bytes);
  ctx.onProgress?.('Saving', 90);
  const blob = new Blob([text], { type: 'text/plain' });
  return {
    blob,
    outputName: 'extracted.txt',
    outputSize: blob.size,
    meta: { characters: text.length },
  };
}

function splitPdfTextPages(text: string): string[] {
  return text
    .split(/\n\n(?=--- Page \d+ ---)/)
    .map((page) => page.replace(/^--- Page \d+ ---\s*/, '').trim());
}

export async function processPdfToHtml(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Extracting selectable text', 20);
  const { bytes } = await readPdfFile(files[0]);
  const { extractPdfText } = await import('@/lib/pdf/render');
  const text = await extractPdfText(bytes);
  const pageTexts = splitPdfTextPages(text);
  const body = pageTexts.map((page, index) => {
    const pageNumber = index + 1;
    const paragraphs = page
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('\n');
    return `<section aria-label="Page ${pageNumber}"><h2>Page ${pageNumber}</h2>\n${paragraphs}</section>`;
  }).join('\n');

  if (!body || pageTexts.every((page) => !page.trim())) {
    throw new PdfProcessError('No selectable text was found. This may be a scanned PDF; OCR is not available in this browser-only version.');
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(files[0].name.replace(/\.pdf$/i, ''))}</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1rem;color:#172033}section{margin:2rem 0;padding-bottom:1rem;border-bottom:1px solid #ddd}h2{font-size:1rem;color:#64748b}p{white-space:pre-wrap;margin:.5rem 0}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
  ctx.onProgress?.('Creating HTML document', 90);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return {
    blob,
    outputName: `${files[0].name.replace(/\.pdf$/i, '') || 'document'}.html`,
    outputSize: blob.size,
    meta: { pages: pageTexts.length, characters: text.length },
  };
}

export async function processPdfToWord(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  ctx.onProgress?.('Extracting selectable text', 20);
  const { bytes } = await readPdfFile(files[0]);
  const { extractPdfText } = await import('@/lib/pdf/render');
  const text = await extractPdfText(bytes);
  const pages = splitPdfTextPages(text);
  if (pages.every((page) => !page.trim())) {
    throw new PdfProcessError('No selectable text was found. This may be a scanned PDF; OCR is not available in this browser-only version.');
  }

  const paragraphs = pages.map((page, index) => {
    const pageBreak = index === 0 ? '' : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    const content = page
      ? `<w:p><w:r><w:t xml:space="preserve">${escapeXml(page)}</w:t></w:r></w:p>`
      : '<w:p/>';
    return `${pageBreak}${content}`;
  }).join('');
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', documentXml);
  ctx.onProgress?.('Creating Word document', 90);
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return {
    blob,
    outputName: `${files[0].name.replace(/\.pdf$/i, '') || 'document'}.docx`,
    outputSize: blob.size,
    meta: { pages: pages.length, characters: text.length },
  };
}

function escapeXml(value: string): string {
  const sanitized = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 0xfffe || code === 0xffff
      ? '\uFFFD'
      : character;
  }).join('');
  return sanitized
    .replace(/[&<>"']/g, (character) => {
      switch (character) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        default: return '&apos;';
      }
    });
}

export async function processCompare(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  if (files.length !== 2) throw new PdfProcessError('Compare needs exactly two PDF files.');
  ctx.onProgress?.('Extracting text from both PDFs', 15);
  const { extractPdfText } = await import('@/lib/pdf/render');
  const [firstBytes, secondBytes] = await Promise.all(files.map((file) => file.arrayBuffer()));
  if (!firstBytes || !secondBytes || !isPdfMagic(firstBytes) || !isPdfMagic(secondBytes)) {
    throw new PdfProcessError('Both files must be valid PDFs.');
  }
  const [firstText, secondText] = await Promise.all([
    extractPdfText(firstBytes),
    extractPdfText(secondBytes),
  ]);
  const firstPages = splitPdfTextPages(firstText);
  const secondPages = splitPdfTextPages(secondText);
  if (firstPages.every((page) => !page.trim()) || secondPages.every((page) => !page.trim())) {
    throw new PdfProcessError('Selectable text is missing from one or both PDFs. Image-only comparisons are not supported.');
  }

  const changedPages: number[] = [];
  const report = [];
  const pageCount = Math.max(firstPages.length, secondPages.length);
  for (let index = 0; index < pageCount; index++) {
    const first = firstPages[index] ?? '';
    const second = secondPages[index] ?? '';
    if (first.replace(/\s+/g, ' ').trim() === second.replace(/\s+/g, ' ').trim()) continue;
    changedPages.push(index + 1);
    report.push(`<section><h2>Page ${index + 1} differs</h2><h3>${escapeHtml(files[0].name)}</h3><pre>${escapeHtml(first || '[No page at this position]')}</pre><h3>${escapeHtml(files[1].name)}</h3><pre>${escapeHtml(second || '[No page at this position]')}</pre></section>`);
  }
  ctx.onProgress?.('Building comparison report', 90);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PDF text comparison</title><style>body{font:15px/1.6 system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#172033}section{border-bottom:1px solid #ddd;padding:1rem 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f9;padding:1rem;border-radius:.5rem}h2{color:#0f766e}</style></head><body><h1>PDF text comparison</h1><p>Compared selectable text page by page. Visual-only differences are not included.</p><p>${changedPages.length} changed page${changedPages.length === 1 ? '' : 's'} out of ${pageCount} page positions.</p>${report.join('\n') || '<p>No selectable text differences found.</p>'}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return {
    blob,
    outputName: 'pdf-text-comparison.html',
    outputSize: blob.size,
    meta: { changedPages: changedPages.length, comparedPages: pageCount },
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export async function processPdfToZip(files: File[], _config: Record<string, string>, ctx: ProcessContext = {}) {
  const result = await processPdfToImages(files, { format: 'jpg' }, ctx);
  return {
    ...result,
    outputName: `${files[0].name.replace(/\.pdf$/i, '') || 'pdf-pages'}.jpg.zip`,
  };
}

export const processors: Record<string, ProcessFn> = {
  'compress-image': processImageCompress,
  'resize-image': processImageResize,
  'convert-image': processImageConvert,
  merge: processMerge,
  split: processSplit,
  extract: processExtract,
  rotate: processRotate,
  compress: processCompress,
  optimize: processOptimize,
  flatten: processFlatten,
  'remove-metadata': processRemoveMetadata,
  'delete-pages': processDeletePages,
  reverse: processReverse,
  'organize-pages': processOrganize,
  duplicate: processDuplicate,
  'insert-blank': processInsertBlank,
  crop: processCrop,
  'jpg-to-pdf': processImagesToPdf,
  'png-to-pdf': processImagesToPdf,
  'images-to-pdf': processImagesToPdf,
  'text-to-pdf': processTextToPdf,
  'page-numbers': processPageNumbers,
  headers: processHeadersFooters,
  watermark: processWatermark,
  'add-text': processAddText,
  'edit-pdf': processAddImageToPdf,
  sign: processAddImageToPdf,
  'page-count': processPageCount,
  metadata: processPageCount,
  'pdf-to-jpg': processPdfToImages,
  'pdf-to-png': (files, config, ctx) => processPdfToImages(files, { ...config, format: 'png' }, ctx),
  'pdf-to-text': processPdfToText,
  'pdf-to-html': processPdfToHtml,
  'pdf-to-zip': processPdfToZip,
  'pdf-to-word': processPdfToWord,
  compare: processCompare,
};

export { parseRanges, PdfProcessError };
