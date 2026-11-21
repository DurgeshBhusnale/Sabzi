import { describe, expect, it } from 'vitest';
import { canMarkDelivery, cutoffPhrase, dayPart, effectiveStatus, groupBySlot, slotDayLabel, slotPhrase, slotWindowLabel, type VendorRequestRow } from '../src/requests.ts';

// 21 Nov 2026 is a Saturday. 08:00 IST = 02:30Z, 18:00 IST = 12:30Z.
const morning = new Date('2026-11-21T03:30:00Z'); // 09:00 IST Sat

describe('slot labels', () => {
  it('day part by IST start', () => {
    expect(dayPart('2026-11-21T02:30:00Z')).toBe('morning');
    expect(dayPart('2026-11-21T08:30:00Z')).toBe('afternoon'); // 14:00
    expect(dayPart('2026-11-21T12:30:00Z')).toBe('evening');
  });
  it('today / tomorrow / weekday', () => {
    expect(slotDayLabel('2026-11-21T12:30:00Z', morning)).toBe('Today evening');
    expect(slotDayLabel('2026-11-22T02:30:00Z', morning)).toBe('Tomorrow morning');
    expect(slotDayLabel('2026-11-23T02:30:00Z', morning)).toBe('Monday morning');
    expect(slotPhrase('2026-11-21T12:30:00Z', morning)).toBe('this evening');
    expect(slotPhrase('2026-11-22T02:30:00Z', morning)).toBe('tomorrow morning');
  });
  it('time window in IST', () => {
    expect(slotWindowLabel('2026-11-22T02:30:00Z', '2026-11-22T03:15:00Z')).toBe('8:00–8:45 AM');
  });
  it('cutoff phrase: 5 h before an evening slot, 10:30 PM the night before a morning slot', () => {
    expect(cutoffPhrase('2026-11-21T07:30:00Z', morning)).toBe('1:00 PM today');
    expect(cutoffPhrase('2026-11-21T17:00:00Z', morning)).toBe('10:30 PM tonight');
    expect(cutoffPhrase('2026-11-22T17:00:00Z', morning)).toBe('10:30 PM tomorrow');
  });
});

const row = (o: Partial<VendorRequestRow>): VendorRequestRow => ({
  id: Math.random().toString(36),
  item_id: 'tomato',
  item_name: 'Tomato',
  free_text: null,
  qty: '1 kg',
  note: null,
  buyer_first_name: 'Priya',
  society_name: 'Green Park Residency',
  status: 'open',
  default_unit: 'kg',
  for_date: '2026-11-22',
  stop_id: 's1',
  slot_start: '2026-11-22T02:30:00Z',
  slot_end: '2026-11-22T03:15:00Z',
  gate_name: 'Gate 1',
  ...o,
});

describe('groupBySlot (vendor screen)', () => {
  it('groups by visit, soonest first, then by item', () => {
    const slots = groupBySlot([
      row({}),
      row({ buyer_first_name: 'Arjun', qty: '500 g' }),
      row({ stop_id: 's2', for_date: '2026-11-21', slot_start: '2026-11-21T12:30:00Z', slot_end: '2026-11-21T13:15:00Z', item_id: 'onion', item_name: 'Onion' }),
    ], morning);
    expect(slots.map((s) => s.stop_id)).toEqual(['s2', 's1']);
    expect(slots[1]!.items[0]!.count).toBe(2);
    expect(slots[1]!.items[0]!.totalLabel).toBe('1.5 kg');
  });
  it('drops visits that are over and cancelled rows', () => {
    const slots = groupBySlot([row({ slot_start: '2026-11-21T01:00:00Z', slot_end: '2026-11-21T02:00:00Z' }), row({ status: 'cancelled' })], morning);
    expect(slots).toEqual([]);
  });
  it('decision, counts, price pre-fill and the confirmed list', () => {
    const [slot] = groupBySlot([
      row({ status: 'will_bring', quoted_price: 40, quoted_unit: 'kg' }),
      row({ status: 'accepted', quoted_price: 40, quoted_unit: 'kg', buyer_first_name: 'Arjun', qty: '2 kg' }),
      row({ status: 'declined', quoted_price: 40, quoted_unit: 'kg' }),
    ], morning);
    const g = slot!.items[0]!;
    expect(g.decision).toBe('accepted');
    expect(g.counts).toMatchObject({ quoted: 1, confirmed: 1, declined: 1, waiting: 0 });
    expect(g.price).toBe(40);
    expect(g.confirmed).toEqual([{ buyer: 'Arjun', society: 'Green Park Residency', qty: '2 kg', note: null }]);
    expect(g.confirmedTotal).toBe('2 kg');
  });
  it('pending while anyone is still waiting; uses the last menu price before a quote', () => {
    const [slot] = groupBySlot([row({ last_price: 35, last_unit: 'kg' }), row({ status: 'cant_bring' })], morning);
    expect(slot!.items[0]!.decision).toBe('pending');
    expect(slot!.items[0]!.price).toBe(35);
  });
  it('denied when every answer is no', () => {
    const [slot] = groupBySlot([row({ status: 'cant_bring' })], morning);
    expect(slot!.items[0]!.decision).toBe('denied');
  });
});

describe('effectiveStatus', () => {
  it('unanswered or unconfirmed rows expire when the visit starts', () => {
    const after = new Date('2026-11-22T02:31:00Z');
    expect(effectiveStatus({ status: 'open', slot_start: '2026-11-22T02:30:00Z' }, after)).toBe('expired');
    expect(effectiveStatus({ status: 'will_bring', slot_start: '2026-11-22T02:30:00Z' }, after)).toBe('expired');
    expect(effectiveStatus({ status: 'accepted', slot_start: '2026-11-22T02:30:00Z' }, after)).toBe('accepted');
    expect(effectiveStatus({ status: 'open', slot_start: '2026-11-22T02:30:00Z' }, morning)).toBe('open');
  });
});

describe('delivery (vendor marks each confirmed order)', () => {
  const during = new Date('2026-11-22T02:40:00Z'); // 8:10 AM IST, during the visit
  it('groups one buyer’s confirmed items into one order and keeps the visit after it ends', () => {
    const after = new Date('2026-11-22T06:00:00Z'); // 11:30 AM IST, visit over
    const [slot] = groupBySlot([
      row({ status: 'accepted', buyer_ref: 'p', quoted_price: 40, quoted_unit: 'kg' }),
      row({ status: 'accepted', buyer_ref: 'p', item_id: 'onion', item_name: 'Onion', qty: '1 kg' }),
      row({ status: 'delivered', buyer_ref: 'a', buyer_first_name: 'Arjun', delivered_at: '2026-11-22T02:35:00Z' }),
      row({ status: 'open', buyer_ref: 'm', buyer_first_name: 'Meera' }),
    ], after);
    expect(slot!.orders.map((o) => [o.buyer, o.ids.length, o.state])).toEqual([['Arjun', 1, 'delivered'], ['Priya', 2, 'pending']]);
    expect(slot!.deliverable).toBe(true);
  });
  it('can be marked from 1 hour before the visit until the end of the next day', () => {
    expect(canMarkDelivery('2026-11-22T02:30:00Z', new Date('2026-11-22T01:00:00Z'))).toBe(false);
    expect(canMarkDelivery('2026-11-22T02:30:00Z', during)).toBe(true);
    expect(canMarkDelivery('2026-11-22T02:30:00Z', new Date('2026-11-23T18:29:00Z'))).toBe(true);
    expect(canMarkDelivery('2026-11-22T02:30:00Z', new Date('2026-11-23T18:31:00Z'))).toBe(false);
  });
  it('unmarked confirmed orders read "not recorded" after the window, and the visit drops off', () => {
    const late = new Date('2026-11-24T00:00:00Z');
    expect(effectiveStatus({ status: 'accepted', slot_start: '2026-11-22T02:30:00Z' }, late)).toBe('not_recorded');
    expect(groupBySlot([row({ status: 'accepted' })], late)).toEqual([]);
  });
});
