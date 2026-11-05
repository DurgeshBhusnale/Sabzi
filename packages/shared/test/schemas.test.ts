import { describe, expect, it } from 'vitest';
import {
  otpSchema,
  phoneLocalSchema,
  priceSchema,
  requestSchema,
  reviewSchema,
  stopSchema,
  toE164,
} from '../src/schemas.ts';

const id = '11111111-1111-4111-8111-111111111111';

describe('schemas', () => {
  it('validates Indian phone numbers', () => {
    expect(phoneLocalSchema.safeParse('9876543210').success).toBe(true);
    expect(phoneLocalSchema.safeParse('5876543210').success).toBe(false);
    expect(phoneLocalSchema.safeParse('98765').success).toBe(false);
    expect(toE164('98765 43210')).toBe('+919876543210');
  });
  it('validates OTP', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('12345').success).toBe(false);
  });
  it('keeps prices between 1 and 999', () => {
    expect(priceSchema.safeParse(0).success).toBe(false);
    expect(priceSchema.safeParse(1).success).toBe(true);
    expect(priceSchema.safeParse(999).success).toBe(true);
    expect(priceSchema.safeParse(1000).success).toBe(false);
  });
  it('limits review text to 300 characters', () => {
    expect(reviewSchema.safeParse({ vendor_id: id, stars: 5, tags: ['fresh'], text: 'a'.repeat(300) }).success).toBe(
      true,
    );
    expect(reviewSchema.safeParse({ vendor_id: id, stars: 5, tags: [], text: 'a'.repeat(301) }).success).toBe(false);
    expect(reviewSchema.safeParse({ vendor_id: id, stars: 6, tags: [] }).success).toBe(false);
  });
  it('requires either an item or free text on requests', () => {
    expect(requestSchema.safeParse({ vendor_id: id, society_id: id, item_id: id }).success).toBe(true);
    expect(requestSchema.safeParse({ vendor_id: id, society_id: id, free_text: 'Drumsticks' }).success).toBe(true);
    expect(requestSchema.safeParse({ vendor_id: id, society_id: id }).success).toBe(false);
  });
  it('requires end after start on stops', () => {
    const base = { vendor_id: id, gate_id: id, days_of_week: [1], active: true };
    expect(stopSchema.safeParse({ ...base, window_start: '08:00', window_end: '08:45' }).success).toBe(true);
    expect(stopSchema.safeParse({ ...base, window_start: '09:00', window_end: '08:45' }).success).toBe(false);
  });
});
