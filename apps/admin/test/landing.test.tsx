import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const card = {
  code: 'RMSH4K7P', display_name: 'Ramesh Sabzi', photo_path: null, vehicle: 'tempo', delivery_available: true, avg_rating: 4.4, rating_count: 128,
  menu: { updated_at: '2026-11-05T01:12:00Z', stock_photo_path: null, items: [{ name: 'Tomato', price: 40, unit: 'kg', sold_out: false }, { name: 'Coriander', price: 10, unit: 'bunch', sold_out: true }] },
  stops: [{ society: 'Green Park Residency', gate: 'Gate 1', window_start: '08:00:00', window_end: '08:45:00', skipped_today: false }],
  arrived_at: null,
};
const rpc = vi.fn(async (name: string) => ({ data: name === 'public_vendor_card' ? card : null, error: null }));
vi.mock('../lib/server/public', () => ({ publicClient: () => ({ rpc }), storageUrl: () => null }));

describe('§9.4 web fallback page (QR without the app)', () => {
  it('shows the vendor card, menu preview, Play Store button and Open link', async () => {
    const { default: Page } = await import('../app/v/[code]/page');
    render(await Page({ params: Promise.resolve({ code: 'RMSH4K7P' }) }));
    expect(screen.getByText('Ramesh Sabzi')).toBeTruthy();
    expect(screen.getByText('₹40 / kg')).toBeTruthy();
    expect(screen.getByText('Sold out')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Get the app to follow Ramesh' }).getAttribute('href')).toMatch(/play\.google\.com/);
    expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe('pheri://v/RMSH4K7P');
    expect(rpc).toHaveBeenCalledWith('record_qr_scan', { p_code: 'RMSH4K7P', p_source: 'web' });
  });
  it('unknown code says the vendor is not available', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    const { default: Page } = await import('../app/v/[code]/page');
    render(await Page({ params: Promise.resolve({ code: 'NOPE' }) }));
    expect(screen.getByText("This vendor isn't available any more.")).toBeTruthy();
  });
});
