import { PDFDocument } from 'pdf-lib';

export class PdfProcessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfProcessError';
  }
}

export async function loadPdf(bytes: ArrayBuffer): Promise<PDFDocument> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    if (doc.isEncrypted) {
      throw new PdfProcessError(
        'This PDF is password-protected. FolioUp does not remove passwords unless you supply the correct one, and that tool is not available yet.',
      );
    }
    return doc;
  } catch (err) {
    if (err instanceof PdfProcessError) throw err;
    const message = err instanceof Error ? err.message : '';
    if (/encrypt|password/i.test(message)) {
      throw new PdfProcessError(
        'This PDF is password-protected or encrypted. Unlock it with the correct password before using this tool.',
      );
    }
    throw new PdfProcessError(
      'This file could not be read as a PDF. It may be damaged or not a valid PDF document.',
    );
  }
}

export async function savePdf(doc: PDFDocument, name: string, useObjectStreams = true) {
  const bytes = await doc.save({ useObjectStreams });

  const blobBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(blobBuffer).set(bytes);

  const blob = new Blob([blobBuffer], {
    type: 'application/pdf',
  });
  return { blob, outputName: name, outputSize: blob.size, bytes };
}

export function isPdfMagic(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 5));
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}
