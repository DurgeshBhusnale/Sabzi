import { describe, expect, it } from 'vitest';
import { PRODUCE_ART_KEYS, produceArtKey, produceTileGround } from '../src/produce.ts';

describe('produceArtKey', () => {
  it.each([
    ['Tomato', 'tomato'],
    ['Bhindi (okra)', 'bhindi-okra'],
    ['Methi (fenugreek)', 'methi-fenugreek'],
    ['Palak (spinach)', 'palak-spinach'],
    ['Green chilli', 'green-chilli'],
    ['Red capsicum', 'capsicum'],
    ['Bottle gourd (dudhi)', 'bottle-gourd-lauki'],
    ['Green peas (matar)', 'green-peas'],
    ['Baby corn', 'corn'],
    ['Raw banana', 'banana'],
    ['Orange (santra)', 'orange-santra'],
    ['Sweet lime', 'sweet-lime-mosambi'],
  ])('%s → %s', (name, key) => {
    expect(produceArtKey(name)).toBe(key);
  });
  it('does not mistake look-alike names', () => {
    expect(produceArtKey('Sweet potato')).toBeNull();
    expect(produceArtKey('Spring onion')).toBeNull();
    expect(produceArtKey('Kantola (spiny gourd)')).toBeNull();
  });
  it('every key is a known picture', () => {
    for (const n of ['Tomato', 'Onion', 'Potato', 'Ginger', 'Lemon', 'Cabbage', 'Cauliflower', 'Brinjal', 'Cucumber', 'Carrot', 'Beetroot', 'Coriander']) {
      expect(PRODUCE_ART_KEYS).toContain(produceArtKey(n));
    }
  });
  it('tile ground is stable per name', () => {
    expect(produceTileGround('Tomato')).toBe(produceTileGround('Tomato'));
  });
});
