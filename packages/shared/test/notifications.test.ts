import { describe, expect, it } from 'vitest';
import {
  arrivalMessage,
  dealMessage,
  leavingSoonMessage,
  notComingMessage,
  pushAllowedNow,
  requestReplyMessage,
  vendorRatingMessage,
  vendorRequestsMessage,
  type MsgItem,
} from '../src/notifications.ts';

const menu: MsgItem[] = [
  { name: 'Tomato', price: 40, unit: 'kg', deal_price: 30 },
  { name: 'Onion', price: 30, unit: 'kg' },
  { name: 'Methi (fenugreek)', price: 15, unit: 'bunch' },
  { name: 'Bhindi (okra)', price: 60, unit: 'kg' },
  { name: 'Palak (spinach)', price: 15, unit: 'bunch' },
  { name: 'Coriander', price: 10, unit: 'bunch', sold_out: true, deal_price: 5 },
  ...['Potato', 'Cauliflower', 'Cabbage', 'Green chilli', 'Capsicum', 'Brinjal'].map((n) => ({ name: n, price: 30, unit: 'kg' as const })),
];

describe('push copy matches design brief §9.1', () => {
  it('arrival', () => {
    expect(arrivalMessage('Ramesh Sabzi', 'Gate 1', menu)).toEqual({
      title: 'Ramesh is at Gate 1 now',
      body: 'Tomato ₹40/kg · Onion ₹30/kg · Methi ₹15/bunch + 8 more',
    });
  });
  it('arrival with 12 available items says + 9 more', () => {
    const twelve = menu.map((m) => ({ ...m, sold_out: false }));
    expect(arrivalMessage('Ramesh Sabzi', 'Gate 1', twelve).body).toBe('Tomato ₹40/kg · Onion ₹30/kg · Methi ₹15/bunch + 9 more');
  });
  it('leaving soon', () => {
    expect(leavingSoonMessage('Ramesh Sabzi', 'Gate 1', [menu[0]!, menu[3]!, menu[4]!, menu[1]!])).toEqual({
      title: 'Ramesh leaves Gate 1 in 10 min',
      body: 'Still has tomato, bhindi, palak',
    });
  });
  it('evening deal', () => {
    const items: MsgItem[] = [
      { name: 'Tomato', price: 40, unit: 'kg', deal_price: 30 },
      { name: 'Coriander', price: 10, unit: 'bunch', deal_price: 5 },
    ];
    expect(dealMessage('Ramesh Sabzi', items)).toEqual({ title: 'Evening deal from Ramesh', body: 'Tomato now ₹30/kg (was ₹40) · Coriander ₹5/bunch' });
  });
  it('not coming', () => {
    expect(notComingMessage('Ramesh Sabzi', 'Green Park Residency')).toEqual({ title: "Ramesh isn't coming to Green Park today", body: "We'll tell you when he's back" });
  });
  it('request reply', () => {
    expect(requestReplyMessage('Ramesh Sabzi', 'Drumsticks', '500 g', true)).toEqual({ title: 'Ramesh will bring drumsticks tomorrow', body: 'Your request for 500 g' });
    expect(requestReplyMessage('Ramesh Sabzi', 'Drumsticks', null, false).title).toBe("Ramesh can't bring drumsticks tomorrow");
  });
  it('vendor: new requests', () => {
    expect(vendorRequestsMessage([{ name: 'Broccoli', count: 2 }, { name: 'Drumsticks', count: 3 }, { name: 'Baby corn', count: 1 }])).toEqual({
      title: '6 requests for tomorrow',
      body: 'Drumsticks ×3, Broccoli ×2, Baby corn ×1',
    });
  });
  it('vendor: new rating', () => {
    expect(vendorRatingMessage(5, 'Green Park Residency', null, ['Always fresh', 'correct weight'])).toEqual({
      title: 'New 5★ rating from Green Park',
      body: '"Always fresh, correct weight"',
    });
  });
});

describe('quiet hours (NOT-3)', () => {
  const night = new Date('2026-11-05T16:30:00Z'); // 22:00 IST
  const day = new Date('2026-11-05T06:30:00Z'); // 12:00 IST
  it('blocks deals and request replies at night', () => {
    expect(pushAllowedNow('deal', night)).toBe(false);
    expect(pushAllowedNow('request_reply', night)).toBe(false);
    expect(pushAllowedNow('deal', day)).toBe(true);
  });
  it('always allows arrival alerts', () => {
    expect(pushAllowedNow('arrival', night)).toBe(true);
    expect(pushAllowedNow('leaving_soon', night)).toBe(true);
  });
});
