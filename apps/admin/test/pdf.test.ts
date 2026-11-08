import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { A4, A6, buildPosterPdf, buildStickerPdf } from '../lib/pdf';

function decodePng(bytes: Uint8Array): string | null {
  const png = PNG.sync.read(Buffer.from(bytes));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
}

async function imageCount(pdf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdf);
  let n = 0;
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) n++;
  }
  return n;
}

describe('QR sticker PDF (ADM-4, §9.3)', () => {
  it('is A6 portrait with a QR that decodes to the vendor URL', async () => {
    const { pdf, qr, url } = await buildStickerPdf({ name: 'Ramesh Sabzi', code: 'RMSH4K7P', verified: true });
    expect(url).toBe('https://pheri.anchorlit.in/v/RMSH4K7P');
    expect(decodePng(qr)).toBe('https://pheri.anchorlit.in/v/RMSH4K7P');
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(Math.round(A6.width));
    expect(Math.round(height)).toBe(Math.round(A6.height));
    expect(await imageCount(pdf)).toBeGreaterThanOrEqual(1);
  });
});

describe('society poster PDF', () => {
  it('is A4 with a QR to the society page', async () => {
    const { pdf, qr } = await buildPosterPdf({ id: '40000000-0000-4000-8000-000000000001', name: 'Green Park Residency', vendors: [{ name: 'Ramesh Sabzi', rating: 4.4 }, { name: 'Imran Vegetables' }] });
    expect(decodePng(qr)).toBe('https://pheri.anchorlit.in/s/40000000-0000-4000-8000-000000000001');
    const doc = await PDFDocument.load(pdf);
    expect(Math.round(doc.getPage(0).getSize().width)).toBe(Math.round(A4.width));
  });
});
