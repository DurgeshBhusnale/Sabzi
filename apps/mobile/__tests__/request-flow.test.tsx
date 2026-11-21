import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderUi } from '../src/test/render';
import { SlotTile } from '../src/ui';
import type { MyRequest } from '../src/features/engagement/api';

const mockRespond = jest.fn(async () => undefined);
const mockCancel = jest.fn(async () => undefined);
jest.mock('../src/features/engagement/api', () => ({
  respondToQuote: (...a: unknown[]) => mockRespond(...(a as [])),
  cancelRequest: (...a: unknown[]) => mockCancel(...(a as [])),
}));

// eslint-disable-next-line import/first
import { buyerRequestView, requestSteps, sectionRequests } from '../src/features/engagement/requestView';
// eslint-disable-next-line import/first
import { BuyerRequestCard } from '../src/features/engagement/BuyerRequestCard';

// Saturday 21 Nov 2026, 7:30 PM IST. Visit: tomorrow 8:00–8:45 AM IST.
const now = new Date('2026-11-21T14:00:00Z');
const r = (o: Partial<MyRequest> = {}): MyRequest => ({
  id: 'q1', vendor_id: 'v', vendor_name: 'Ramesh Sabzi', society_name: 'Green Park Residency', item_id: 't', item_name: 'Tomato',
  qty: '2 kg', note: null, for_date: '2026-11-22', status: 'open', quoted_price: null, quoted_unit: null,
  slot_start: '2026-11-22T02:30:00Z', slot_end: '2026-11-22T03:15:00Z', cutoff_at: '2026-11-21T17:00:00Z', gate_name: 'Gate 1',
  created_at: '2026-11-21T10:00:00Z', answered_at: null, responded_at: null, ...o,
});

describe('buyer request wording (owner copy)', () => {
  it.each([
    [r(), "Waiting for Ramesh's reply", 'Waiting for reply'],
    [r({ status: 'will_bring', quoted_price: 40, quoted_unit: 'kg' }), 'Ramesh can bring it', 'Confirm price'],
    [r({ status: 'accepted', quoted_price: 40, quoted_unit: 'kg' }), 'Order confirmed', 'Confirmed'],
    [r({ status: 'cant_bring' }), 'Sorry, not possible', 'Not possible'],
    [r({ status: 'vendor_cancelled', quoted_price: 40 }), "Sorry, Ramesh can't bring it after all", 'Cancelled by vendor'],
    [r({ status: 'expired' }), "Sorry, Ramesh didn't confirm in time", 'Expired'],
    [r({ status: 'expired', quoted_price: 40 }), "Sorry, you didn't confirm in time", 'Expired'],
  ])('%#', (req, headline, pill) => {
    const v = buyerRequestView(req, now);
    expect(v.headline).toBe(headline);
    expect(v.pill.label).toBe(pill);
  });
  it('slot and price formatting', () => {
    const v = buyerRequestView(r({ status: 'will_bring', quoted_price: 40, quoted_unit: 'kg' }), now);
    expect(v.when).toBe('Tomorrow morning · 8:00–8:45 AM');
    expect(v.price).toBe('₹40 / kg');
    expect(v.detail).toBe('Confirm the price and Ramesh will bring it tomorrow morning.');
    expect(v.needsReply).toBe(true);
  });
});

describe('B-12 sections', () => {
  it('needs-your-reply first, then upcoming, then past', () => {
    const s = sectionRequests([
      r({ id: 'past', status: 'cant_bring' }),
      r({ id: 'up', status: 'accepted', quoted_price: 40 }),
      r({ id: 'act', status: 'will_bring', quoted_price: 40 }),
    ], now);
    expect(s.action.map((x) => x.id)).toEqual(['act']);
    expect(s.upcoming.map((x) => x.id)).toEqual(['up']);
    expect(s.past.map((x) => x.id)).toEqual(['past']);
  });
});

describe('B-12a timeline', () => {
  it('quoted: sent ✓, vendor accepted ✓, you confirm (current), visit (todo)', () => {
    const steps = requestSteps(r({ status: 'will_bring', quoted_price: 40, quoted_unit: 'kg', answered_at: '2026-11-21T13:00:00Z' }));
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'current', 'todo']);
    expect(steps[1]!.label).toBe('Ramesh accepted · about ₹40 / kg');
  });
  it('confirmed: the visit is next', () => {
    expect(requestSteps(r({ status: 'accepted', quoted_price: 40 })).map((s) => s.state)).toEqual(['done', 'done', 'done', 'current']);
  });
  it('denied stops after the vendor step', () => {
    expect(requestSteps(r({ status: 'cant_bring' })).map((s) => s.state)).toEqual(['done', 'failed']);
  });
});

describe('B-12 card: Confirm order is a real button on the card', () => {
  const wrap = (node: React.ReactNode) => <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>;
  it('quoted request shows price, Confirm order and Not now', async () => {
    const onPress = jest.fn();
    await renderUi(wrap(<BuyerRequestCard request={r({ status: 'will_bring', quoted_price: 40, quoted_unit: 'kg' })} onPress={onPress} now={now} />));
    expect(screen.getByTestId('request-price')).toHaveTextContent('Approx. price₹40 / kg');
    await fireEvent.press(screen.getByTestId('confirm-q1'));
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith('q1', true));
    await fireEvent.press(screen.getByTestId('decline-q1'));
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith('q1', false));
  });
  it('confirmed request shows a success block and no answer buttons', async () => {
    await renderUi(wrap(<BuyerRequestCard request={r({ status: 'accepted', quoted_price: 40, quoted_unit: 'kg' })} onPress={jest.fn()} now={now} />));
    expect(screen.getByTestId('request-status-success')).toBeTruthy();
    expect(screen.queryByTestId('confirm-q1')).toBeNull();
  });
});

describe('SlotTile', () => {
  it('is a radio with the selected state, even when it is the only slot', async () => {
    const onPress = jest.fn();
    await renderUi(<SlotTile testID="slot" day="Tomorrow morning" window="8:00–8:45 AM · Gate 1" cutoff="Order by 10:30 PM tonight" selected onPress={onPress} />);
    const tile = screen.getByTestId('slot');
    expect(tile.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByText('Order by 10:30 PM tonight')).toBeTruthy();
    await fireEvent.press(tile);
    expect(onPress).toHaveBeenCalled();
  });
});
