import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerReady = false;

function ensureWorker() {
  if (workerReady) return;
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  workerReady = true;
}

export async function openPdfJs(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  ensureWorker();
  return getDocument({ data: new Uint8Array(bytes), disableRange: true }).promise;
}


export async function renderPageToBlob(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: { scale: number; mime: 'image/jpeg' | 'image/png'; quality: number },
): Promise<{ blob: Blob; width: number; height: number }> {
  const page = await pdf.getPage(pageNumber);
  const canvas = document.createElement('canvas');

  try {
    const viewport = page.getViewport({ scale: options.scale });
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas is not available in this browser.');
    }

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    await page.render({ canvasContext: ctx, viewport }).promise;

    const width = canvas.width;
    const height = canvas.height;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, options.mime, options.quality);
    });

    if (!blob) {
      throw new Error('Could not render a page image.');
    }

    return { blob, width, height };
  } finally {
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
  }
}



export async function extractPdfText(bytes: ArrayBuffer): Promise<string> {
  const pdf = await openPdfJs(bytes);

  try {
    const parts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      try {
        const content = await page.getTextContent();

        const line = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        parts.push(`--- Page ${i} ---\n${line}`);
      } finally {
        page.cleanup();
      }
    }

    return parts.join('\n\n');
  } finally {
    await pdf.destroy();
  }
}

