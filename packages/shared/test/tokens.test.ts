import { describe, expect, it } from 'vitest';
import { buyerType, darkColors, fontFamilies, lightColors, vendorType } from '../src/tokens.ts';

describe('tokens', () => {
  it('light and dark have the same keys', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
  it('uses the v4 palette', () => {
    expect(lightColors.primary).toBe('#0F3D2A');
    expect(lightColors.forest).toBe('#0F3D2A');
    expect(lightColors.accent).toBe('#178046');
    expect(lightColors.bg).toBe('#F6F5EF');
    expect(lightColors.textPrimary).toBe('#10241A');
  });
  it('uses the v4 fonts', () => {
    expect(fontFamilies).toEqual({ heading: 'Newsreader', body: 'Figtree' });
    expect(buyerType.h1.fontFamily).toBe('Newsreader');
    expect(buyerType.body.fontFamily).toBe('Figtree');
  });
  it('vendor scale is 2 px larger', () => {
    for (const k of ['body', 'bodySmall', 'caption', 'button', 'eyebrow', 'label'] as const) {
      expect(vendorType[k].fontSize).toBe(buyerType[k].fontSize + 2);
    }
    expect(vendorType.price.fontSize).toBe(22);
    expect(buyerType.price.fontSize).toBe(18);
  });
});
