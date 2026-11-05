import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import { APP_NAME, PUBLIC_BASE_URL } from '@sabzi/shared/constants';
import { lightColors, qrColors } from '@sabzi/shared/tokens';

/** mm → PDF points */
const mm = (v: number) => (v * 72) / 25.4;
export const A6 = { width: mm(105), height: mm(148) };
export const A4 = { width: mm(210), height: mm(297) };

const hex = (h: string) => {
  const n = Number.parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export const vendorUrl = (code: string) => `${PUBLIC_BASE_URL}/v/${code}`;
export const societyUrl = (id: string) => `${PUBLIC_BASE_URL}/s/${id}`;

/** High-error-correction QR as PNG bytes (black on white, quiet margin) so it scans outdoors and when scuffed. */
export async function qrPng(url: string, size = 600): Promise<Uint8Array> {
  const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', margin: 4, width: size, color: { dark: qrColors.fg, light: qrColors.bg } });
  const b64 = dataUrl.split(',')[1]!;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = hex(lightColors.textPrimary)) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

function fit(text: string, font: PDFFont, size: number, max: number): number {
  let s = size;
  while (s > 8 && font.widthOfTextAtSize(text, s) > max) s -= 1;
  return s;
}

/**
 * §9.3 sticker, A6 portrait: brand-leaf header band with wordmark, large QR on white, vendor name (and photo),
 * "Scan to know when I'm at your gate", "See today's vegetables and prices", Verified mark, vendor code.
 */
export async function buildStickerPdf(v: { name: string; code: string; verified: boolean; photoJpg?: Uint8Array | null }): Promise<{ pdf: Uint8Array; qr: Uint8Array; url: string }> {
  const url = vendorUrl(v.code);
  const doc = await PDFDocument.create();
  doc.setTitle(`${v.name} — ${APP_NAME} sticker`);
  const page = doc.addPage([A6.width, A6.height]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const W = page.getWidth();
  const H = page.getHeight();

  page.drawRectangle({ x: 0, y: H - mm(24), width: W, height: mm(24), color: hex(lightColors.primary) });
  centered(page, APP_NAME, H - mm(15), bold, 26, rgb(1, 1, 1));

  const qr = await qrPng(url);
  const qrImg = await doc.embedPng(qr);
  const q = mm(66);
  page.drawRectangle({ x: (W - q) / 2 - mm(3), y: H - mm(30) - q - mm(3), width: q + mm(6), height: q + mm(6), color: rgb(1, 1, 1), borderColor: hex(lightColors.border), borderWidth: 1 });
  page.drawImage(qrImg, { x: (W - q) / 2, y: H - mm(30) - q, width: q, height: q });

  let y = H - mm(30) - q - mm(12);
  if (v.photoJpg) {
    try {
      const img = await doc.embedJpg(v.photoJpg);
      const d = mm(14);
      page.drawImage(img, { x: mm(8), y: y - mm(4), width: d, height: d });
    } catch {
      // photo is optional
    }
  }
  centered(page, v.name, y, bold, fit(v.name, bold, 20, W - mm(16)));
  y -= mm(8);
  centered(page, "Scan to know when I'm at your gate", y, reg, 11);
  y -= mm(5.5);
  centered(page, "See today's vegetables and prices", y, reg, 11, hex(lightColors.textSecondary));
  y -= mm(8);
  if (v.verified) centered(page, 'Verified by the Sabzi team', y, bold, 10, hex(lightColors.primary));
  centered(page, `Code ${v.code}`, mm(6), reg, 9, hex(lightColors.textSecondary));
  return { pdf: await doc.save(), qr, url };
}

/** §9.3 society poster, A4: headline, QR to the society page, up to 3 vendor names. */
export async function buildPosterPdf(s: { id: string; name: string; vendors: { name: string; rating?: number | null }[] }): Promise<{ pdf: Uint8Array; qr: Uint8Array; url: string }> {
  const url = societyUrl(s.id);
  const doc = await PDFDocument.create();
  doc.setTitle(`${s.name} — ${APP_NAME} poster`);
  const page = doc.addPage([A4.width, A4.height]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const W = page.getWidth();
  const H = page.getHeight();
  page.drawRectangle({ x: 0, y: H - mm(45), width: W, height: mm(45), color: hex(lightColors.primary) });
  centered(page, `Your vegetable vendors are now on ${APP_NAME}`, H - mm(27), bold, fit(`Your vegetable vendors are now on ${APP_NAME}`, bold, 26, W - mm(20)), rgb(1, 1, 1));
  centered(page, s.name, H - mm(60), bold, 22);
  centered(page, 'Know when your vendor is at the gate. See today\'s prices.', H - mm(70), reg, 13, hex(lightColors.textSecondary));
  const qr = await qrPng(url, 900);
  const img = await doc.embedPng(qr);
  const q = mm(110);
  page.drawImage(img, { x: (W - q) / 2, y: H - mm(80) - q, width: q, height: q });
  let y = H - mm(80) - q - mm(14);
  centered(page, 'Scan with your phone camera', y, bold, 14);
  y -= mm(12);
  for (const v of s.vendors.slice(0, 3)) {
    centered(page, v.rating ? `${v.name} · ${v.rating.toFixed(1)} stars` : v.name, y, reg, 14);
    y -= mm(8);
  }
  return { pdf: await doc.save(), qr, url };
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
