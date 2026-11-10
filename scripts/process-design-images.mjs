#!/usr/bin/env node
/**
 * Resizes the Pheri v4 image pack (Claude Design "uploads/") into app-ready assets.
 *
 *   node scripts/process-design-images.mjs [sourceDir]
 *
 * sourceDir defaults to design-import/uploads (git-ignored; the originals are ~60 MB).
 * Files are found by their ID prefix (A01, B08, C12, D01…) anywhere under sourceDir, so the
 * folder layout of the download does not matter. Re-run after replacing any picture.
 *
 * Output:
 *   apps/mobile/assets/images/produce/*.webp       A01–A33 cut-outs, 320 px, transparent
 *   apps/mobile/assets/images/illustrations/*.webp C01–C15, 720 px
 *   apps/mobile/assets/images/photos/*.webp        B07 deal banner, B15 sample stock photo
 *   apps/mobile/assets/*.png                       app icon, adaptive icon, splash (D01, C15)
 *   apps/admin/public/images/**                    website and admin pictures
 */
import { readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));
const sharp = require('sharp');

const src = process.argv[2] ?? join(root, 'design-import/uploads');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(src);
const find = (id) => {
  const f = files.find((p) => basename(p).startsWith(`${id}-`));
  if (!f) throw new Error(`Missing ${id} in ${src}`);
  return f;
};
const slug = (id) => basename(find(id)).replace(/^[A-Z]\d+-/, '').replace(/\.(png|jpe?g)$/i, '');

const mobile = join(root, 'apps/mobile/assets');
const web = join(root, 'apps/admin/public/images');
const out = (p) => {
  mkdirSync(dirname(p), { recursive: true });
  return p;
};

const jobs = [];
const add = (id, dest, fn) => jobs.push([id, dest, fn]);

// A — produce cut-outs (mobile tiles + website menu)
for (let n = 1; n <= 33; n++) {
  const id = `A${String(n).padStart(2, '0')}`;
  add(id, join(mobile, 'images/produce', `${slug(id)}.webp`), (s) => s.resize(320, 320).webp({ quality: 82, alphaQuality: 90 }));
  add(id, join(web, 'produce', `${slug(id)}.webp`), (s) => s.resize(400, 400).webp({ quality: 82, alphaQuality: 90 }));
}

// C — illustrations
for (let n = 1; n <= 15; n++) {
  const id = `C${String(n).padStart(2, '0')}`;
  if (id === 'C14') continue; // admin only
  add(id, join(mobile, 'images/illustrations', `${slug(id)}.webp`), (s) => s.resize(720, 720).webp({ quality: 80 }));
}
add('C14', join(web, 'illustrations/admin-verification.webp'), (s) => s.resize(480, 480).webp({ quality: 80 }));

// B — photography
add('B07', join(mobile, 'images/photos/evening-deal-banner.webp'), (s) => s.resize(1080, null).webp({ quality: 78 }));
add('B15', join(mobile, 'images/photos/stock-sample.webp'), (s) => s.resize(1080, null).webp({ quality: 78 }));
for (const id of ['B01', 'B02', 'B03', 'B04', 'B05']) {
  add(id, join(web, 'photos', `${slug(id)}.jpg`), (s) => s.resize(1600, null, { withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }));
}
add('B06', join(web, 'photos/cta-band-texture.jpg'), (s) => s.resize(1600, null, { withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }));
for (const id of ['B08', 'B09', 'B10', 'B11', 'B13', 'B14']) {
  add(id, join(web, 'people', `${slug(id)}.jpg`), (s) => s.resize(400, 400).jpeg({ quality: 80, mozjpeg: true }));
}
for (const id of ['B15', 'B16', 'B17', 'B18']) {
  add(id, join(web, 'stock', `${slug(id)}.jpg`), (s) => s.resize(1080, null).jpeg({ quality: 78, mozjpeg: true }));
}

// D — brand
add('D01-app-icon-fullbleed', join(mobile, 'icon.png'), (s) => s.resize(1024, 1024).png());
add('D01', join(mobile, 'favicon.png'), (s) => s.resize(48, 48).png());
add('D01', join(mobile, 'images/brand/app-icon.png'), (s) => s.resize(192, 192).png());
add('D01', join(mobile, 'splash-icon.png'), (s) => s.resize(512, 512).png());
// Adaptive icon: full-bleed art as the background layer, transparent foreground
add('D01-app-icon-fullbleed', join(mobile, 'android-icon-background.png'), (s) => s.resize(1024, 1024).png());
add('D01', join(web, 'brand/app-icon.png'), (s) => s.resize(192, 192).png());
add('D01', join(web, 'brand/favicon.png'), (s) => s.resize(64, 64).png());
add('D02', join(web, 'brand/og-share-card.png'), (s) => s.resize(1200, 630).png({ compressionLevel: 9 }));
add('D03', join(web, 'brand/push-hero.jpg'), (s) => s.flatten({ background: '#F6F5EF' }).resize(1024, null).jpeg({ quality: 80, mozjpeg: true }));

const findExact = (name) => {
  const f = files.find((p) => basename(p).startsWith(`${name}.`));
  if (!f) throw new Error(`Missing ${name} in ${src}`);
  return f;
};

let bytes = 0;
for (const [id, dest, fn] of jobs) {
  const input = id.includes('-') ? findExact(id) : find(id);
  const info = await fn(sharp(input)).toFile(out(dest));
  bytes += info.size;
}
// Adaptive foreground: fully transparent (the background layer carries the whole icon)
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .png()
  .toFile(out(join(mobile, 'android-icon-foreground.png')));
console.log(`Wrote ${jobs.length + 1} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
