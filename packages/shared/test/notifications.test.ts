import { describe, expect, it } from 'vitest';
import { societyRequestSchema } from '../src/schemas.ts';
import {
  arrivalMessage,
  societyAddedMessage,
  dealMessage,
  leavingSoonMessage,
  notComingMessage,
  pushAllowedNow,
  channelFor,
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
  it('request reply: accepted with a price, denied, backed out', () => {
    const now = new Date('2026-11-21T14:00:00Z'); // 19:30 IST
    const slot = '2026-11-22T02:30:00Z'; // 08:00 IST tomorrow
    expect(requestReplyMessage('Ramesh Sabzi', { item: 'Drumsticks', qty: '500 g', status: 'will_bring', price: 40, unit: 'kg', slot_start: slot }, now)).toEqual({
      title: 'Ramesh accepted your request for drumsticks',
      body: 'About ₹40/kg for tomorrow morning. Tap to confirm your order.',
    });
    expect(requestReplyMessage('Ramesh Sabzi', { item: 'Drumsticks', qty: '500 g', status: 'cant_bring', slot_start: slot }, now)).toEqual({
      title: "Sorry, Ramesh can't bring drumsticks",
      body: "Your request for 500 g for tomorrow morning wasn't accepted.",
    });
    expect(requestReplyMessage('Ramesh Sabzi', { item: 'Drumsticks', qty: null, status: 'vendor_cancelled', slot_start: '2026-11-21T13:00:00Z' }, new Date('2026-11-21T06:00:00Z'))).toEqual({
      title: "Sorry, Ramesh can't bring drumsticks after all",
      body: 'Your order for this evening is cancelled.',
    });
  });
  it('request: not delivered, with the reason', () => {
    const now = new Date('2026-11-22T05:00:00Z'); // 10:30 AM IST
    expect(requestReplyMessage('Ramesh Sabzi', { item: 'Tomato', qty: '2 kg', status: 'not_delivered', slot_start: '2026-11-22T02:30:00Z', missed_reason: 'buyer_not_there' }, now)).toEqual({
      title: "Sorry, Ramesh couldn't hand over your tomato",
      body: 'Ramesh says no one was at the gate this morning.',
    });
    expect(requestReplyMessage('Ramesh Sabzi', { item: 'Tomato', qty: null, status: 'not_delivered', missed_reason: 'vendor_unavailable', slot_start: '2026-11-22T02:30:00Z' }, now).body).toBe("Ramesh couldn't get it this morning.");
  });
  it('vendor: new requests', () => {
    expect(vendorRequestsMessage([{ name: 'Broccoli', count: 2 }, { name: 'Drumsticks', count: 3 }, { name: 'Baby corn', count: 1 }])).toEqual({
      title: '6 requests need your reply',
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
  it('blocks deals and rating alerts at night', () => {
    expect(pushAllowedNow('deal', night)).toBe(false);
    expect(pushAllowedNow('vendor_new_rating', night)).toBe(false);
    expect(pushAllowedNow('deal', day)).toBe(true);
  });
  it('always allows request-flow messages (transactional)', () => {
    expect(pushAllowedNow('request_reply', night)).toBe(true);
    expect(pushAllowedNow('vendor_new_requests', night)).toBe(true);
  });
  it('routes every kind to a high-importance channel', () => {
    expect(channelFor('arrival')).toBe('arrivals');
    expect(channelFor('leaving_soon')).toBe('arrivals');
    expect(channelFor('request_reply')).toBe('alerts');
    expect(channelFor('deal')).toBe('alerts');
  });
  it('always allows arrival alerts', () => {
    expect(pushAllowedNow('arrival', night)).toBe(true);
    expect(pushAllowedNow('leaving_soon', night)).toBe(true);
  });
});

describe('society added (owner review 2026-11-21)', () => {
  it('names the society and the app', () => {
    expect(societyAddedMessage('Suyash Towers').title).toBe('Suyash Towers is now on Pheri');
  });
  it('waits for the morning in quiet hours', () => {
    expect(pushAllowedNow('society_added', new Date('2026-11-05T17:00:00Z'))).toBe(false); // 10:30 PM IST
    expect(pushAllowedNow('society_added', new Date('2026-11-05T06:30:00Z'))).toBe(true);
  });
});

describe('society request schema', () => {
  it('a new society needs name and address; a listed one only the name', () => {
    expect(societyRequestSchema.safeParse({ name: 'Suyash Towers', address: '', society_id: null }).success).toBe(false);
    expect(societyRequestSchema.safeParse({ name: 'Suyash Towers', address: 'Paud Road, Pune', society_id: null }).success).toBe(true);
    expect(societyRequestSchema.safeParse({ name: 'Suyash Towers', address: '', society_id: '40000000-0000-4000-8000-000000000001' }).success).toBe(true);
  });
});
