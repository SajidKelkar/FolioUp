import { describe, expect, it, vi } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import {
  parseRanges,
  processMerge,
  processSplit,
  processExtract,
  processRotate,
  processDeletePages,
  processReverse,
  processCompress,
  processOptimize,
  processCompare,
  processPageNumbers,
  processHeadersFooters,
  processWatermark,
  processRemoveMetadata,
  processImagesToPdf,
  processImageCompress,
  processImageConvert,
  processImageResize,
  processPdfToText,
  processPdfToHtml,
  processPdfToWord,
  processPdfToZip,
  processTextToPdf,
  processPageCount,
  processOrganize,
  processDuplicate,
  processInsertBlank,
  processCrop,
  processFlatten,
  processAddText,
  processAddImageToPdf,
  compressionPresets,
  processors,
  PdfProcessError,
} from '@/lib/processors';
import { tools } from '@/lib/tools';

const compressionRenderCalls = vi.hoisted(() => [] as Array<{ scale: number; quality: number }>);

vi.mock('@/lib/pdf/render', () => ({
  openPdfJs: async () => ({
    numPages: 2,
    getPage: async (pageNumber: number) => ({
      getViewport: () => ({ width: 200, height: 250 }),
      getTextContent: async () => ({ items: [{ str: `Page ${pageNumber} text & <raw>` }] }),
      cleanup: () => undefined,
    }),
    destroy: async () => undefined,
  }),
  extractPdfText: async () => '--- Page 1 ---\nPage 1 text & <raw>\n\n--- Page 2 ---\nPage 2 text & <raw>',
  renderPageToBlob: async (
    _pdf: unknown,
    _page: number,
    options: { scale: number; mime: 'image/jpeg' | 'image/png'; quality: number },
  ) => {
    compressionRenderCalls.push({ scale: options.scale, quality: options.quality });
    const jpeg = Uint8Array.from(
      atob('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJgA/9k='),
      (character) => character.charCodeAt(0),
    );
    return { blob: new Blob([jpeg], { type: options.mime }), width: 1, height: 1 };
  },
}));

async function makePdf(pages = 3, opts?: { title?: string }) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([400, 500]);
    page.drawText(`Page ${i + 1}`, { x: 40, y: 250, size: 18, font, color: rgb(0, 0, 0) });
  }
  if (opts?.title) doc.setTitle(opts.title);
  const bytes = await doc.save();

const fileBuffer = new ArrayBuffer(bytes.byteLength);
new Uint8Array(fileBuffer).set(bytes);

return new File(
  [fileBuffer],
  `${opts?.title || 'sample'}.pdf`,
  { type: 'application/pdf' },
);
}

async function makePdfWithWidths(widths: number[]) {
  const doc = await PDFDocument.create();
  for (const width of widths) doc.addPage([width, 500]);
  const bytes = await doc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new File([buffer], 'sized.pdf', { type: 'application/pdf' });
}

describe('parseRanges', () => {
  it('parses mixed ranges', () => {
    expect(parseRanges('1-3, 5, 7-8', 10)).toEqual([[1, 3], [5, 5], [7, 8]]);
  });
  it('rejects malformed and out-of-document ranges', () => {
    expect(() => parseRanges('1-2x', 4)).toThrow('Use page numbers or ranges');
    expect(() => parseRanges('0-2', 4)).toThrow('between 1 and 4');
    expect(() => parseRanges('99', 4)).toThrow('between 1 and 4');
  });
});

describe('PDF processors', () => {
  it('merges page counts in file order', async () => {
    const a = await makePdf(2, { title: 'A' });
    const b = await makePdf(3, { title: 'B' });
    const result = await processMerge([a, b], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(5);
    expect(result.outputSize).toBeGreaterThan(0);
  });

  it('rejects merge with one file', async () => {
    const a = await makePdf(1);
    await expect(processMerge([a], {})).rejects.toBeInstanceOf(PdfProcessError);
  });

  it('splits into the requested number of parts', async () => {
    const file = await makePdf(5);
    const result = await processSplit([file], { ranges: '1-2, 4' });
    expect(result.outputName.endsWith('.zip')).toBe(true);
    expect(result.meta?.parts).toBe(2);
    expect(result.meta?.totalPages).toBe(5);
    const zip = await JSZip.loadAsync(result.blob);
    const first = await PDFDocument.load(await zip.file('split_1_pages_1-2.pdf')!.async('uint8array'));
    const second = await PDFDocument.load(await zip.file('split_2_pages_4.pdf')!.async('uint8array'));
    expect(first.getPageCount()).toBe(2);
    expect(second.getPageCount()).toBe(1);
  });

  it('extracts selected pages', async () => {
    const file = await makePdf(4);
    const result = await processExtract([file], { pages: '2,4' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
  });

  it('rotates pages by 90 degrees', async () => {
    const file = await makePdf(1);
    const result = await processRotate([file], { angle: '90' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPages()[0].getRotation().angle).toBe(90);
    const reverse = await processRotate([file], { angle: '270' });
    const reverseDoc = await PDFDocument.load(await reverse.blob.arrayBuffer());
    expect(reverseDoc.getPages()[0].getRotation().angle).toBe(270);
    await expect(processRotate([file], { angle: '45' })).rejects.toThrow('90, 180, or 270');
  });

  it('deletes pages and keeps the rest', async () => {
    const file = await makePdf(4);
    const result = await processDeletePages([file], { pages: '2-3' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
  });

  it('refuses to delete every page', async () => {
    const file = await makePdf(2);
    await expect(processDeletePages([file], { pages: '1-2' })).rejects.toBeInstanceOf(PdfProcessError);
  });

  it('reverses page order', async () => {
    const file = await makePdf(3);
    const result = await processReverse([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(3);
  });

  it('organizes pages in the given order', async () => {
    const file = await makePdfWithWidths([400, 500, 600]);
    const result = await processOrganize([file], { order: '3,1,2' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPages().map((page) => page.getWidth())).toEqual([600, 400, 500]);
  });

  it('rejects invalid pages instead of silently dropping them when organizing', async () => {
    await expect(processOrganize([await makePdf(3)], { order: '1,99' })).rejects.toThrow(
      'Enter a page order using numbers from 1 to 3',
    );
  });

  it('duplicates a page', async () => {
    const file = await makePdf(2);
    const result = await processDuplicate([file], { pages: '1' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(3);
  });

  it('inserts blank pages after a position', async () => {
    const file = await makePdf(2);
    const result = await processInsertBlank([file], { after: '1', count: '2' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(4);
  });

  it('rejects out-of-range blank-page settings', async () => {
    const file = await makePdf(2);
    await expect(processInsertBlank([file], { after: '3', count: '1' })).rejects.toBeInstanceOf(PdfProcessError);
    await expect(processInsertBlank([file], { after: '0', count: '21' })).rejects.toBeInstanceOf(PdfProcessError);
    await expect(processInsertBlank([file], { after: '1.5', count: '1' })).rejects.toBeInstanceOf(PdfProcessError);
  });

  it('crops pages to the requested margins and rejects margins that remove the page', async () => {
    const file = await makePdfWithWidths([400]);
    const cropped = await processCrop([file], { margin: '36' });
    const out = await PDFDocument.load(await cropped.blob.arrayBuffer());
    expect(out.getPages()[0].getWidth()).toBe(328);
    await expect(processCrop([file], { margin: '250' })).rejects.toThrow('margin is too large');
  });

  it('fits compression targets and uses distinct raster settings', async () => {
    const source = await PDFDocument.load(await (await makePdf(2, { title: 'Compress Me' })).arrayBuffer());
    await source.attach(new Uint8Array(32_000), 'padding.bin');
    const fileBytes = await source.save();
    const fileBuffer = new ArrayBuffer(fileBytes.byteLength);
    new Uint8Array(fileBuffer).set(fileBytes);
    const file = new File([fileBuffer], 'Compress Me.pdf', { type: 'application/pdf' });
    compressionRenderCalls.length = 0;
    for (const preset of compressionPresets) {
      const { level } = preset;
      const result = await processCompress([file], { level });
      const out = await PDFDocument.load(await result.blob.arrayBuffer());
      expect(out.getPageCount()).toBe(2);
      expect(result.meta?.level).toBe(level);
      expect(result.meta?.targetReduction).toBe(preset.targetReduction);
      expect(result.outputSize).toBeGreaterThan(0);
      expect(result.meta?.originalSize).toBe(file.size);
      expect(result.outputSize).toBeLessThanOrEqual(file.size);
    }
    expect(new Set(compressionRenderCalls.map(({ quality }) => quality))).toEqual(new Set([0.96, 0.86, 0.7]));
    expect(compressionRenderCalls.every(({ scale }) => scale >= 0.5 && scale <= 2.25)).toBe(true);
    expect(compressionRenderCalls.length).toBeGreaterThan(compressionPresets.length);
  });

  it('optimizes by rewriting the PDF and never returns a larger file', async () => {
    const file = await makePdf(2);
    const result = await processOptimize([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
    expect(result.outputSize).toBeLessThanOrEqual(file.size);
    expect(result.meta?.originalSize).toBe(file.size);
  });

  it('requires exactly two files for PDF comparison', async () => {
    await expect(processCompare([await makePdf(1)], {})).rejects.toThrow('exactly two PDF files');
  });

  it('rejects unknown compression levels', async () => {
    await expect(processCompress([await makePdf(1)], { level: 'ultra' })).rejects.toThrow(
      'Choose Basic, Medium, or Extreme compression.',
    );
  });

  it('rewrites PDFs with no form fields when flattening', async () => {
    const result = await processFlatten([await makePdf(2)], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
  });

  it('rejects files that are not PDFs', async () => {
    const fake = new File([new Uint8Array([0, 1, 2, 3, 4])], 'nope.pdf', { type: 'application/pdf' });
    await expect(processPageCount([fake], {})).rejects.toBeInstanceOf(PdfProcessError);
  });

  it('adds page numbers and watermarks', async () => {
    const file = await makePdf(2);
    const numbered = await processPageNumbers([file], { position: 'bottom-center', start: '10' });
    const numberedDoc = await PDFDocument.load(await numbered.blob.arrayBuffer());
    expect(numberedDoc.getPageCount()).toBe(2);
    const topNumbers = await processPageNumbers([file], { position: 'top-left', start: '10' });
    expect(new Uint8Array(await topNumbers.blob.arrayBuffer())).not.toEqual(
      new Uint8Array(await numbered.blob.arrayBuffer()),
    );
    const marked = await processWatermark([file], { text: 'TEST', opacity: '30' });
    const markedDoc = await PDFDocument.load(await marked.blob.arrayBuffer());
    expect(markedDoc.getPageCount()).toBe(2);
    const strongerMark = await processWatermark([file], { text: 'TEST', opacity: '70' });
    expect(new Uint8Array(await strongerMark.blob.arrayBuffer())).not.toEqual(
      new Uint8Array(await marked.blob.arrayBuffer()),
    );
  });

  it('adds configured headers and footers to every page', async () => {
    const file = await makePdf(2);
    const result = await processHeadersFooters([file], { text: 'Internal copy', position: 'top-right' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
    await expect(processHeadersFooters([file], { text: '  ' })).rejects.toThrow('Enter the header or footer text.');
    await expect(processHeadersFooters([file], { text: 'x'.repeat(121) })).rejects.toThrow('120 characters or fewer');
    await expect(processHeadersFooters([file], { text: 'Valid', position: 'middle-left' })).rejects.toThrow(
      'valid header or footer position',
    );
  });

  it('clears title metadata', async () => {
    const file = await makePdf(1, { title: 'Secret' });
    const result = await processRemoveMetadata([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getTitle() || '').toBe('');
  });

  it('counts pages', async () => {
    const file = await makePdf(6);
    const result = await processPageCount([file], {});
    expect(result.meta?.pages).toBe(6);
    expect(result.outputSize).toBe(0);
  });

  it('wraps text into a PDF', async () => {
    const file = new File(['Hello FolioUp\nSecond line'], 'note.txt', { type: 'text/plain' });
    const result = await processTextToPdf([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('exports PDF text and safely formats HTML and Word documents', async () => {
    const file = await makePdf(2, { title: 'source' });

    const text = await processPdfToText([file], {});
    expect(await text.blob.text()).toContain('Page 1 text & <raw>');
    expect(text.outputName).toBe('extracted.txt');

    const html = await processPdfToHtml([file], {});
    const htmlContent = await html.blob.text();
    expect(html.outputName).toBe('source.html');
    expect(htmlContent).toContain('<section aria-label="Page 2">');
    expect(htmlContent).toContain('Page 1 text &amp; &lt;raw&gt;');

    const word = await processPdfToWord([file], {});
    const wordArchive = await JSZip.loadAsync(word.blob);
    const documentXml = await wordArchive.file('word/document.xml')!.async('text');
    expect(word.outputName).toBe('source.docx');
    expect(documentXml).toContain('Page 1 text &amp; &lt;raw&gt;');
    expect(documentXml).toContain('<w:br w:type="page"/>');
  });

  it('renders PDF-to-image outputs and packages pages in ZIP archives', async () => {
    const file = await makePdf(2);

    for (const [toolId, extension] of [['pdf-to-jpg', 'jpg'], ['pdf-to-png', 'png']] as const) {
      const result = await processors[toolId]([file], {}, {});
      const archive = await JSZip.loadAsync(result.blob);
      expect(Object.keys(archive.files).filter((name) => !archive.files[name].dir)).toEqual([
        `page-001.${extension}`,
        `page-002.${extension}`,
      ]);
      expect(result.meta?.format).toBe(extension);
    }

    const zipped = await processPdfToZip([file], {});
    const archive = await JSZip.loadAsync(zipped.blob);
    expect(zipped.outputName).toBe('sample.jpg.zip');
    expect(archive.file('page-001.jpg')).not.toBeNull();
    expect(archive.file('page-002.jpg')).not.toBeNull();
  });

  it('wraps long unbroken text across pages instead of clipping it', async () => {
    const file = new File(['x'.repeat(12000)], 'long.txt', { type: 'text/plain' });
    const result = await processTextToPdf([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBeGreaterThan(1);
  });

  it('reports unsupported Unicode text clearly', async () => {
    const textFile = new File(['Hello 😀'], 'unicode.txt', { type: 'text/plain' });
    await expect(processTextToPdf([textFile], {})).rejects.toThrow('cannot be rendered by the built-in PDF font');
    await expect(processWatermark([await makePdf(1)], { text: 'Review 😀' })).rejects.toThrow(
      'cannot be rendered by the built-in PDF font',
    );
    await expect(processAddText([await makePdf(1)], { text: 'Review 😀', page: '1' })).rejects.toThrow(
      'cannot be rendered by the built-in PDF font',
    );
  });

  it('preserves paragraph spacing in text-to-PDF output', async () => {
    const file = new File(['First paragraph\n\nSecond paragraph'], 'paragraphs.txt', { type: 'text/plain' });
    const result = await processTextToPdf([file], {});
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(1);
  });

  it('embeds a PNG into a PDF', async () => {
    const png = Uint8Array.from(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='),
      (c) => c.charCodeAt(0),
    );
    const file = new File([png], 'pixel.png', { type: 'image/png' });
    const result = await processImagesToPdf([file], { pageSize: 'fit' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(1);
    const portrait = await processImagesToPdf([file], { pageSize: 'a4', orientation: 'portrait' });
    const portraitPage = (await PDFDocument.load(await portrait.blob.arrayBuffer())).getPages()[0];
    expect(portraitPage.getHeight()).toBeGreaterThan(portraitPage.getWidth());
    const landscape = await processImagesToPdf([file], { pageSize: 'a4', orientation: 'landscape' });
    const landscapePage = (await PDFDocument.load(await landscape.blob.arrayBuffer())).getPages()[0];
    expect(landscapePage.getWidth()).toBeGreaterThan(landscapePage.getHeight());
    await expect(processImagesToPdf([file], { pageSize: 'custom', orientation: 'auto' })).rejects.toThrow(
      'Fit to image, A4, or US Letter',
    );
    await expect(processImagesToPdf([file], { pageSize: 'a4', orientation: 'diagonal' })).rejects.toThrow(
      'Auto, Portrait, or Landscape',
    );
  });

  it('compresses, converts, and resizes images with distinct output workflows', async () => {
    const bitmap = { width: 4, height: 3, close: vi.fn() };
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback, mime: string) => {
      callback(new Blob(['compressed image'], { type: mime }));
    });
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap));
    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage, fillRect, fillStyle: '' }),
        toBlob,
      }),
    });

    try {
      const inputs = [
        new File(['first'], 'portrait.jpg', { type: 'image/jpeg' }),
        new File(['second'], 'portrait.png', { type: 'image/png' }),
      ];
      const result = await processImageCompress(inputs, { format: 'webp', quality: '65' });
      const archive = await JSZip.loadAsync(result.blob);

      expect(result.outputName).toBe('2-compressed-images.zip');
      expect(archive.file('portrait.webp')).not.toBeNull();
      expect(archive.file('portrait-2.webp')).not.toBeNull();
      expect(result.meta).toMatchObject({ images: 2, originalSize: 11, compressedSize: 32, format: 'webp' });
      expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.65);
      expect(bitmap.close).toHaveBeenCalledTimes(2);

      await processImageCompress([inputs[0]], { format: 'jpeg', quality: '75' });
      expect(fillRect).toHaveBeenCalledWith(0, 0, 4, 3);
      expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), 'image/jpeg', 0.75);
      const converted = await processImageConvert([inputs[0], inputs[1]], { format: 'png' });
      expect(converted.outputName).toBe('2-converted-images.zip');
      const resized = await processImageResize([inputs[0]], { width: '2', height: '2', format: 'webp' });
      expect(resized.meta).toMatchObject({ dimensions: '2 × 2 px', format: 'webp' });
      expect(drawImage).toHaveBeenLastCalledWith(bitmap, 0, 0, 2, 2);
      const resizedBatch = await processImageResize(inputs, { width: '2', height: '2', format: 'webp' });
      const resizedArchive = await JSZip.loadAsync(resizedBatch.blob);
      expect(resizedBatch.outputName).toBe('2-resized-images.zip');
      expect(resizedArchive.file('portrait.webp')).not.toBeNull();
      expect(resizedArchive.file('portrait-2.webp')).not.toBeNull();
      await expect(processImageResize([inputs[0]], { width: '0', height: '2' })).rejects.toThrow(
        'whole-number dimensions from 1 to 12000',
      );
      vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ ...bitmap, width: 10000, height: 5000 })));
      await expect(processImageCompress([inputs[0]], { format: 'webp' })).rejects.toThrow(
        'too large for browser compression',
      );
      await expect(processImageCompress([inputs[0]], { format: 'webp', quality: '101' })).rejects.toThrow(
        'quality between 10% and 100%',
      );
      await expect(processImageCompress([inputs[0]], { format: 'gif' })).rejects.toThrow(
        'Choose WebP, JPEG, or PNG',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('rejects an empty watermark rather than reporting a blank result', async () => {
    await expect(processWatermark([await makePdf(1)], { text: '' })).rejects.toThrow(
      'Enter the watermark text.',
    );
    await expect(processWatermark([await makePdf(1)], { text: '   ' })).rejects.toThrow(
      'Enter the watermark text.',
    );
    await expect(processWatermark([await makePdf(1)], { text: 'W'.repeat(81) })).rejects.toThrow(
      '80 characters or fewer',
    );
    await expect(processWatermark([await makePdf(1)], { text: 'Valid', opacity: '101' })).rejects.toThrow(
      'opacity between 5% and 80%',
    );
  });

  it('adds text to the requested page and returns a valid document', async () => {
    const result = await processAddText([await makePdf(2)], { text: 'Review copy', page: '2' });
    const out = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(2);
    await expect(processAddText([await makePdf(2)], { text: 'x'.repeat(201), page: '1' })).rejects.toThrow(
      '200 characters or fewer',
    );
    await expect(processAddText([await makePdf(2)], { text: 'Annotation', page: '1abc' })).rejects.toThrow(
      'positive whole number',
    );
  });

  it('stamps a selected PNG image onto the requested PDF page', async () => {
    const png = Uint8Array.from(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='),
      (character) => character.charCodeAt(0),
    );
    const image = new File([png], 'stamp.png', { type: 'image/png' });
    const pdf = await makePdf(2);
    const result = await processAddImageToPdf([image, pdf], {
      page: '2',
      position: 'top-right',
      size: '25',
    });
    const output = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(2);
    expect(result.outputName).toBe('sample-stamped.pdf');
    expect(result.meta?.page).toBe(2);
    await expect(processAddImageToPdf([pdf, image], { page: '3' })).rejects.toThrow(
      'outside this PDF',
    );
  });

  it('registers a processor for every tool advertised as available', () => {
    for (const tool of tools.filter((item) => item.status === 'active')) {
      expect(processors[tool.id], `${tool.name} should have a processor`).toBeTypeOf('function');
    }
  });

  it('keeps tool option defaults and visibility rules valid', () => {
    for (const tool of tools) {
      const optionsById = new Map(tool.configOptions.map((option) => [option.id, option]));
      expect(optionsById.size, `${tool.name} must not repeat option IDs`).toBe(tool.configOptions.length);
      for (const option of tool.configOptions) {
        if (option.type === 'select') {
          expect(
            option.options?.some((item) => item.value === String(option.default)),
            `${tool.name}: ${option.label} default must be an available choice`,
          ).toBe(true);
        }
        if (option.type === 'range') {
          expect(Number(option.default)).toBeGreaterThanOrEqual(option.min ?? Number.NEGATIVE_INFINITY);
          expect(Number(option.default)).toBeLessThanOrEqual(option.max ?? Number.POSITIVE_INFINITY);
          expect(option.step).toBeGreaterThan(0);
        }
        if (option.visibleWhen) {
          const dependency = optionsById.get(option.visibleWhen.id);
          expect(dependency, `${tool.name}: visibility rule must reference an existing option`).toBeDefined();
          expect(
            option.visibleWhen.values.every((value) =>
              dependency?.options?.some((choice) => choice.value === value),
            ),
            `${tool.name}: visibility rule must reference valid choices`,
          ).toBe(true);
        }
      }
    }
  });
});
