import { describe, expect, it } from 'vitest';
import { groupRequests, parseQty, sumQuantities, type RequestLite } from '../src/requests.ts';

const r = (o: Partial<RequestLite>): RequestLite => ({
  id: Math.random().toString(), item_id: 'drum', item_name: 'Drumsticks', free_text: null, qty: null, note: null,
  buyer_first_name: 'Priya', society_name: 'Green Park Residency', status: 'open', ...o,
});

describe('quantity parsing', () => {
  it('parses grams, kilos, pieces and bunches', () => {
    expect(parseQty('500 g')).toEqual({ kind: 'g', amount: 500 });
    expect(parseQty('1 kg')).toEqual({ kind: 'g', amount: 1000 });
    expect(parseQty('1.5kg')).toEqual({ kind: 'g', amount: 1500 });
    expect(parseQty('2 pieces')).toEqual({ kind: 'piece', amount: 2 });
    expect(parseQty('3 bunch')).toEqual({ kind: 'bunch', amount: 3 });
    expect(parseQty('a few')).toBeNull();
    expect(parseQty(null)).toBeNull();
  });
});

describe('summing quantities (VEN-10)', () => {
  it('adds grams and kilos into kg', () => {
    expect(sumQuantities(['500 g', '1 kg'])).toBe('1.5 kg');
    expect(sumQuantities(['250 g', '250 g', '500 g'])).toBe('1 kg');
    expect(sumQuantities(['250 g', '500 g'])).toBe('750 g');
  });
  it('keeps different unit kinds apart', () => {
    expect(sumQuantities(['1 kg', '2 pieces', '1 piece'])).toBe('1 kg + 3 pieces');
  });
  it('ignores missing quantities and keeps unknown text', () => {
    expect(sumQuantities([null, '500 g', null])).toBe('500 g');
    expect(sumQuantities([null, null])).toBeNull();
    expect(sumQuantities(['500 g', 'a big one'])).toBe('500 g + a big one');
  });
});

describe('grouping', () => {
  it('groups by item with counts, totals, societies and notes', () => {
    const groups = groupRequests([
      r({ qty: '500 g' }),
      r({ qty: '1 kg', buyer_first_name: 'Arjun', society_name: 'Sahyadri Heights', note: 'Fresh ones please' }),
      r({ item_id: 'broc', item_name: 'Broccoli', qty: '1 piece' }),
      r({ item_id: null, item_name: null, free_text: 'baby spinach', qty: '250 g' }),
      r({ item_id: null, item_name: null, free_text: 'Baby Spinach ', qty: '250 g' }),
      r({ qty: '2 kg', status: 'cancelled' }),
    ]);
    expect(groups.map((g) => [g.name, g.count, g.totalLabel])).toEqual([
      ['Baby spinach', 2, '500 g'],
      ['Drumsticks', 2, '1.5 kg'],
      ['Broccoli', 1, '1 piece'],
    ]);
    const drum = groups.find((g) => g.key === 'drum')!;
    expect(drum.societies).toEqual(['Green Park Residency', 'Sahyadri Heights']);
    expect(drum.notes).toEqual([{ buyer: 'Arjun', society: 'Sahyadri Heights', qty: '1 kg', note: 'Fresh ones please' }]);
    expect(groups.find((g) => g.key === 'free:baby spinach')).toBeTruthy();
  });
  it('reports the answer status per group', () => {
    expect(groupRequests([r({ status: 'will_bring' }), r({ status: 'will_bring' })])[0]!.status).toBe('will_bring');
    expect(groupRequests([r({ status: 'will_bring' }), r({ status: 'open' })])[0]!.status).toBe('mixed');
  });
});
