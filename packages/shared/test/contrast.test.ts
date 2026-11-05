import { describe, expect, it } from 'vitest';
import { darkColors, lightColors, type ColorTokens } from '../src/tokens.ts';

function lum(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

/** Text/background pairs the components use (M12 accessibility pass, WCAG 2.1 AA 4.5:1 for body text). */
const PAIRS: [keyof ColorTokens, keyof ColorTokens][] = [
  ['textPrimary', 'bg'], ['textPrimary', 'surface'], ['textPrimary', 'surface2'],
  ['textSecondary', 'bg'], ['textSecondary', 'surface'], ['textSecondary', 'surface2'],
  ['textMuted', 'surface'], ['textMuted', 'bg'],
  ['onPrimary', 'primary'], ['primary', 'surface'], ['onPrimaryTint', 'primaryTint'], ['onPrimaryTint', 'primaryTintStrong'],
  ['error', 'surface'], ['onErrorTint', 'errorTint'], ['dealAmberText', 'dealAmberTint'], ['onDealAmber', 'dealAmber'],
  ['warning', 'warningTint'], ['onInfoTint', 'infoTint'], ['textPrimary', 'primaryTintStrong'],
];

describe('WCAG AA contrast of token pairs', () => {
  it.each(PAIRS)('light: %s on %s ≥ 4.5', (fg, bg) => {
    expect(contrast(lightColors[fg], lightColors[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(PAIRS)('dark: %s on %s ≥ 4.5', (fg, bg) => {
    expect(contrast(darkColors[fg], darkColors[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it('snackbar text and action on its dark ground', () => {
    expect(contrast(lightColors.snackbarText, lightColors.snackbarBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightColors.snackbarAction, lightColors.snackbarBg)).toBeGreaterThanOrEqual(4.5);
  });
  it('brand-leaf is never used behind small white text (only large pills use primary)', () => {
    expect(contrast('#FFFFFF', lightColors.brandLeaf)).toBeLessThan(4.5);
    expect(contrast('#FFFFFF', lightColors.primary)).toBeGreaterThanOrEqual(4.5);
  });
});
