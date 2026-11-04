import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatDuration,
  formatIstRelative,
  formatIstTime,
  formatPrice,
  formatPriceCompact,
  formatTimeWindow,
  greetingFor,
  istDayOfWeek,
  istHour,
  isQuietHours,
  maskPhone,
  toIstDate,
} from '../src/format.ts';

describe('formatPrice', () => {
  it('formats rupees with unit', () => {
    expect(formatPrice(40, 'kg')).toBe('₹40 / kg');
    expect(formatPrice(15, 'bunch')).toBe('₹15 / bunch');
    expect(formatPrice(20, 'g250')).toBe('₹20 / 250 g');
    expect(formatPrice(25, 'g500')).toBe('₹25 / 500 g');
    expect(formatPrice(40, 'piece')).toBe('₹40 / piece');
  });
  it('trims decimals', () => {
    expect(formatPrice(12.5, 'kg')).toBe('₹12.5 / kg');
    expect(formatPrice(12.0, 'kg')).toBe('₹12 / kg');
    expect(formatPrice(12.25, 'kg')).toBe('₹12.25 / kg');
  });
  it('has a compact form for notifications', () => {
    expect(formatPriceCompact(40, 'kg')).toBe('₹40/kg');
  });
});

describe('IST helpers', () => {
  // 2026-11-05T00:30:00Z is 06:00 IST on 5 Nov (Thursday)
  const morning = new Date('2026-11-05T00:30:00Z');
  // 2026-11-04T19:00:00Z is 00:30 IST on 5 Nov
  const afterMidnight = new Date('2026-11-04T19:00:00Z');

  it('converts to the IST calendar date', () => {
    expect(toIstDate(morning)).toBe('2026-11-05');
    expect(toIstDate(afterMidnight)).toBe('2026-11-05');
    expect(toIstDate(new Date('2026-11-04T18:29:00Z'))).toBe('2026-11-04');
  });
  it('gives the IST hour and weekday', () => {
    expect(istHour(morning)).toBe(6);
    expect(istHour(afterMidnight)).toBe(0);
    expect(istDayOfWeek(morning)).toBe(4);
    expect(istDayOfWeek(new Date('2026-11-08T06:00:00Z'))).toBe(7); // Sunday
  });
  it('formats times in IST with AM/PM', () => {
    expect(formatIstTime(new Date('2026-11-05T02:35:00Z'))).toBe('8:05 AM');
    expect(formatIstTime('2026-11-05T06:30:00Z')).toBe('12:00 PM');
    expect(formatIstTime('2026-11-04T18:30:00Z')).toBe('12:00 AM');
    expect(formatIstTime('2026-11-05T12:45:00Z')).toBe('6:15 PM');
  });
  it('formats time windows', () => {
    expect(formatTimeWindow('08:00', '08:45')).toBe('8:00–8:45 AM');
    expect(formatTimeWindow('18:00:00', '18:45:00')).toBe('6:00–6:45 PM');
    expect(formatTimeWindow('11:30', '12:15')).toBe('11:30 AM–12:15 PM');
  });
  it('formats relative days', () => {
    const now = new Date('2026-11-05T05:00:00Z');
    expect(formatIstRelative('2026-11-05T01:08:00Z', now)).toBe('Today 6:38 AM');
    expect(formatIstRelative('2026-11-04T13:40:00Z', now)).toBe('Yesterday 7:10 PM');
    expect(formatIstRelative('2026-11-02T13:40:00Z', now)).toBe('2 Nov, 7:10 PM');
  });
  it('knows quiet hours 21:00–06:00 IST', () => {
    expect(isQuietHours(new Date('2026-11-05T15:29:00Z'))).toBe(false); // 20:59
    expect(isQuietHours(new Date('2026-11-05T15:30:00Z'))).toBe(true); // 21:00
    expect(isQuietHours(new Date('2026-11-05T00:29:00Z'))).toBe(true); // 05:59
    expect(isQuietHours(new Date('2026-11-05T00:30:00Z'))).toBe(false); // 06:00
  });
  it('greets by time of day', () => {
    expect(greetingFor(morning)).toBe('morning');
    expect(greetingFor(new Date('2026-11-05T08:30:00Z'))).toBe('afternoon');
    expect(greetingFor(new Date('2026-11-05T12:30:00Z'))).toBe('evening');
  });
  it('adds days across months', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
});

describe('misc', () => {
  it('masks phones', () => {
    expect(maskPhone('+919876504321')).toBe('+91 ••••• •4321');
  });
  it('formats durations', () => {
    expect(formatDuration(59)).toBe('59 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(130)).toBe('2 h 10 min');
  });
});
