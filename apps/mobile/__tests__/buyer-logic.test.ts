import { homeSections, menuState, needsSearch, topItems } from '../src/features/buyer/homeLogic';
import type { HomeVendor, MenuItemJson } from '../src/features/buyer/types';

const item = (name: string, o: Partial<MenuItemJson> = {}): MenuItemJson => ({ item_id: name, name, price: 40, unit: 'kg', sold_out: false, deal_price: null, deal_at: null, ...o });
const v = (o: Partial<HomeVendor>): HomeVendor => ({
  vendor_id: 'r', stop_id: 's', gate_id: 'g', gate_name: 'Gate 1', window_start: '08:00:00', window_end: '08:45:00', status: 'expected', status_at: null,
  is_following: true, display_name: 'Ramesh Sabzi', photo_path: null, vehicle: 'tempo', delivery_available: true, avg_rating: 4.4, rating_count: 128,
  menu: { menu_id: 'm', published_at: 'x', updated_at: 'x', stock_photo_path: null, stock_photo_at: null, items: [item('Tomato'), item('Onion', { price: 30 })] },
  ...o,
});

const morning = new Date('2026-11-05T02:40:00Z'); // 8:10 AM IST
const evening = new Date('2026-11-05T12:40:00Z'); // 6:10 PM IST

describe('home sections (B-03)', () => {
  it('morning with one vendor at the gate', () => {
    const s = homeSections([v({ status: 'at_gate' }), v({ vendor_id: 'i', display_name: 'Imran', status: 'expected', window_start: '18:00:00', window_end: '18:45:00' })], morning);
    expect(s.atGate.map((x) => x.vendor_id)).toEqual(['r']);
    expect(s.comingToday.map((x) => x.vendor_id)).toEqual(['i']);
    expect(s.nobodyAtGate).toBe(false);
  });
  it('nobody at the gate yet names the next vendor', () => {
    const s = homeSections([v({ vendor_id: 'i', window_start: '18:00:00', window_end: '18:45:00' }), v({})], morning);
    expect(s.nobodyAtGate).toBe(true);
    expect(s.nextExpected?.vendor_id).toBe('r');
    expect(s.comingToday.map((x) => x.vendor_id)).toEqual(['r', 'i']);
  });
  it('evening deals appear only after 5 PM', () => {
    const withDeal = [v({ status: 'left', menu: { menu_id: 'm', published_at: 'x', updated_at: 'x', stock_photo_path: null, stock_photo_at: null, items: [item('Tomato', { deal_price: 30 }), item('Onion', { deal_price: 20, sold_out: true })] } })];
    expect(homeSections(withDeal, morning).showDeals).toBe(false);
    const s = homeSections(withDeal, evening);
    expect(s.showDeals).toBe(true);
    expect(s.deals[0]!.items.map((i) => i.name)).toEqual(['Tomato']);
  });
  it('all vendors left for the day', () => {
    const s = homeSections([v({ status: 'left' }), v({ vendor_id: 'i', status: 'not_coming' })], evening);
    expect(s.allLeft).toBe(true);
    expect(s.notComing).toHaveLength(1);
  });
  it('no vendors serve this society', () => {
    expect(homeSections([], morning).empty).toBe(true);
  });
  it('leaving soon counts as at the gate', () => {
    expect(homeSections([v({ status: 'leaving_soon' })], morning).atGate).toHaveLength(1);
  });
});

describe('menu helpers', () => {
  it('top items put sold out last', () => {
    expect(topItems([item('A', { sold_out: true }), item('B'), item('C'), item('D')]).map((i) => i.name)).toEqual(['B', 'C', 'D']);
  });
  it('menu state', () => {
    expect(menuState([])).toBe('not_posted');
    expect(menuState(null)).toBe('not_posted');
    expect(menuState([item('A', { sold_out: true })])).toBe('all_sold_out');
    expect(menuState([item('A')])).toBe('ok');
  });
  it('search above 12 items', () => {
    expect(needsSearch(Array.from({ length: 12 }, (_, i) => item(`x${i}`)))).toBe(false);
    expect(needsSearch(Array.from({ length: 13 }, (_, i) => item(`x${i}`)))).toBe(true);
  });
});
