import { describe, expect, it } from 'vitest';
import { findStopConflicts, type StopLite } from '../src/stops.ts';

const s = (o: Partial<StopLite>): StopLite => ({ id: 'x', vendor_id: 'ramesh', gate_id: 'gp1', days_of_week: [1, 2, 3, 4, 5, 6], window_start: '08:00', window_end: '08:45', ...o });

describe('stop overlap warning (A-07)', () => {
  it('flags the same vendor in two places at the same time', () => {
    const c = findStopConflicts(s({ id: null, gate_id: 'sh', window_start: '08:30', window_end: '09:10' }), [s({ id: 'a' })]);
    expect(c).toHaveLength(1);
    expect(c[0]!.kind).toBe('vendor_double_booked');
    expect(c[0]!.days).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('back-to-back windows do not overlap', () => {
    expect(findStopConflicts(s({ id: null, gate_id: 'sh', window_start: '08:45', window_end: '09:30' }), [s({ id: 'a' })])).toHaveLength(0);
  });
  it('different days do not overlap', () => {
    expect(findStopConflicts(s({ id: null, days_of_week: [7] }), [s({ id: 'a' })])).toHaveLength(0);
  });
  it('only shared days are reported', () => {
    expect(findStopConflicts(s({ id: null, days_of_week: [5, 6, 7] }), [s({ id: 'a' })])[0]!.days).toEqual([5, 6]);
  });
  it('warns when two vendors share a gate at the same time', () => {
    const c = findStopConflicts(s({ id: null, vendor_id: 'imran' }), [s({ id: 'a' })]);
    expect(c[0]!.kind).toBe('gate_shared');
  });
  it('ignores the stop being edited and inactive stops', () => {
    expect(findStopConflicts(s({ id: 'a' }), [s({ id: 'a' })])).toHaveLength(0);
    expect(findStopConflicts(s({ id: null }), [s({ id: 'b', active: false })])).toHaveLength(0);
  });
});
