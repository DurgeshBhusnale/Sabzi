import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spacing } from '@sabzi/shared/tokens';

const root = join(__dirname, '..');
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === 'node_modules' || f.startsWith('.')) return [];
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

/**
 * Our spacing token names (xs, sm, md, …, screen) also feed Tailwind's sizing utilities, so e.g. `max-w-sm`
 * becomes 12px and squashes the page (login card bug, 9 Nov). Sizing classes must not use those names.
 */
describe('no sizing class collides with a spacing token name', () => {
  it('app and components use arbitrary values instead', () => {
    const names = Object.keys(spacing).join('|');
    const re = new RegExp(`(?<![\\w-])(?:max-w|min-w|w|h|min-h|max-h|size|basis)-(?:${names})(?![\\w-])`, 'g');
    const hits = [...files(join(root, 'app')), ...files(join(root, 'components'))].flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(re)].map((m) => `${f.replace(root, '')}: ${m[0]}`),
    );
    expect(hits).toEqual([]);
  });
});
