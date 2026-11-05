import { describe, expect, it } from 'vitest';
import { buyerType, darkColors, lightColors, vendorType } from '../src/tokens.ts';

describe('tokens', () => {
  it('light and dark have the same keys', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
  it('uses the brief brand colours', () => {
    expect(lightColors.primary).toBe('#178046');
    expect(lightColors.brandLeaf).toBe('#24A05E');
    expect(darkColors.bg).toBe('#0F1411');
  });
  it('vendor scale is larger', () => {
    expect(vendorType.body.fontSize).toBe(18);
    expect(vendorType.button.fontSize).toBe(18);
    expect(vendorType.price.fontSize).toBe(22);
    expect(buyerType.price.fontSize).toBe(18);
  });
});
