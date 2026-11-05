import { describe, expect, it } from 'vitest';
import { computeLiveStatus, statusLabel } from '../src/status.ts';

const now = new Date('2026-11-05T03:00:00Z'); // 8:30 AM IST

describe('computeLiveStatus', () => {
  it('is expected with no events', () => {
    expect(computeLiveStatus([], { now }).status).toBe('expected');
  });
  it('is at the gate after arrival', () => {
    const r = computeLiveStatus([{ type: 'arrived', created_at: '2026-11-05T02:35:00Z' }], { now });
    expect(r).toEqual({ status: 'at_gate', since: '2026-11-05T02:35:00Z' });
  });
  it('is leaving soon', () => {
    const r = computeLiveStatus(
      [
        { type: 'arrived', created_at: '2026-11-05T02:35:00Z' },
        { type: 'leaving_soon', created_at: '2026-11-05T02:55:00Z' },
      ],
      { now },
    );
    expect(r.status).toBe('leaving_soon');
  });
  it('is left after a left event', () => {
    const r = computeLiveStatus(
      [
        { type: 'arrived', created_at: '2026-11-05T02:35:00Z' },
        { type: 'left', created_at: '2026-11-05T02:58:00Z' },
      ],
      { now },
    );
    expect(r.status).toBe('left');
  });
  it('treats arrivals older than 3 h as left', () => {
    const r = computeLiveStatus([{ type: 'arrived', created_at: '2026-11-04T23:00:00Z' }], { now });
    expect(r.status).toBe('left');
  });
  it('is not coming when skipped', () => {
    expect(computeLiveStatus([], { now, skippedToday: true }).status).toBe('not_coming');
    expect(computeLiveStatus([{ type: 'not_going', created_at: '2026-11-05T01:00:00Z' }], { now }).status).toBe(
      'not_coming',
    );
  });
});

describe('statusLabel', () => {
  it('builds labels from the brief', () => {
    expect(statusLabel('at_gate', { gateName: 'Gate 1' })).toBe('At Gate 1 now');
    expect(statusLabel('expected', { windowStart: '08:00', windowEnd: '08:45' })).toBe('Expected 8:00–8:45 AM');
    expect(statusLabel('left', { since: '2026-11-05T03:10:00Z' })).toBe('Left at 8:40 AM');
    expect(statusLabel('not_coming', {})).toBe('Not coming today');
    expect(statusLabel('leaving_soon', {})).toBe('Leaving in 10 min');
  });
});
