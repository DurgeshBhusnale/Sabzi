import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { groupBySlot, type VendorRequestRow } from '@sabzi/shared';
import { renderUi } from '../src/test/render';
import { WriteReviewView } from '../src/features/engagement/WriteReviewView';
import { DealComposer, pctOff, type DealLine } from '../src/features/engagement/DealComposer';
import { VendorRequestsView } from '../src/features/engagement/VendorRequestsView';

describe('B-10 write a review (3-day rule)', () => {
  it('not eligible yet: shows days left and blocks submit', async () => {
    await renderUi(<WriteReviewView vendorName="Ramesh Sabzi" eligibility={{ state: 'too_soon', unlocks_at: '2026-11-07T00:00:00Z', days_left: 2 }} onSubmit={jest.fn()} submitted={false} />);
    expect(screen.getByText('You can rate Ramesh after following him for 3 days — 2 days left')).toBeTruthy();
    expect(screen.getByTestId('submit-review').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('star-5').props.accessibilityState.disabled).toBe(true);
  });
  it('not following', async () => {
    await renderUi(<WriteReviewView vendorName="Ramesh Sabzi" eligibility={{ state: 'not_following' }} onSubmit={jest.fn()} submitted={false} />);
    expect(screen.getByText('Follow Ramesh first. You can rate him after 3 days.')).toBeTruthy();
  });
  it('already reviewed: locked until 7 days pass', async () => {
    await renderUi(<WriteReviewView vendorName="Ramesh" eligibility={{ state: 'locked', review_id: 'r', unlocks_at: '2026-11-12T05:00:00Z' }} initial={{ stars: 4 }} onSubmit={jest.fn()} submitted={false} />);
    expect(screen.getByTestId('review-locked-banner')).toBeTruthy();
    expect(screen.getByTestId('submit-review').props.accessibilityState.disabled).toBe(true);
  });
  it('eligible: stars, tags, text, submit, thank-you', async () => {
    const onSubmit = jest.fn(async () => undefined);
    const r = await renderUi(<WriteReviewView vendorName="Ramesh" eligibility={{ state: 'eligible' }} onSubmit={onSubmit} submitted={false} />);
    expect(screen.getByTestId('submit-review').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('star-5'));
    await fireEvent.press(screen.getByText('Fresh'));
    await fireEvent.changeText(screen.getByTestId('review-text'), ' Always fresh. ');
    await fireEvent.press(screen.getByTestId('submit-review'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ stars: 5, tags: ['fresh'], text: 'Always fresh.' }));
    await r.rerender(<WriteReviewView vendorName="Ramesh" eligibility={{ state: 'eligible' }} onSubmit={onSubmit} submitted />);
    expect(screen.getByTestId('review-thanks')).toBeTruthy();
  });
});

const lines: DealLine[] = [
  { itemId: 't', name: 'Tomato', price: 40, unit: 'kg', soldOut: false },
  { itemId: 'c', name: 'Coriander', price: 10, unit: 'bunch', soldOut: false },
  { itemId: 'o', name: 'Onion', price: 30, unit: 'kg', soldOut: true },
];

describe('V-11 evening price drop (one deal a day)', () => {
  it('already used today', async () => {
    await renderUi(<DealComposer vendorName="Ramesh" lines={lines} remainingFollowers={96} alreadySentAt="2026-11-05T11:42:00Z" hasRemainingStops onSend={jest.fn()} onBack={jest.fn()} />);
    expect(screen.getByText('You can send one deal a day. Next tomorrow.')).toBeTruthy();
    expect(screen.getByText('Your deal went out at 5:12 PM.')).toBeTruthy();
    expect(screen.queryByTestId('send-deal')).toBeNull();
  });
  it('no remaining stops', async () => {
    await renderUi(<DealComposer vendorName="Ramesh" lines={lines} remainingFollowers={0} alreadySentAt={null} hasRemainingStops={false} onSend={jest.fn()} onBack={jest.fn()} />);
    expect(screen.getByTestId('deal-no-stops')).toBeTruthy();
  });
  it('only unsold items, -10% / -20%, preview and send', async () => {
    const onSend = jest.fn(async () => undefined);
    await renderUi(<DealComposer vendorName="Ramesh Sabzi" lines={lines} remainingFollowers={96} alreadySentAt={null} hasRemainingStops onSend={onSend} onBack={jest.fn()} />, { mode: 'vendor' });
    expect(screen.queryByTestId('deal-item-Onion')).toBeNull();
    expect(screen.getByText('Pick items for the deal')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('deal-item-Tomato'));
    await fireEvent.press(screen.getByTestId('pct-10-Tomato'));
    expect(screen.getByText('Evening deal from Ramesh')).toBeTruthy();
    expect(screen.getByText('Tomato now ₹36/kg (was ₹40)')).toBeTruthy();
    await fireEvent.press(screen.getByText('Send to 96 followers at your remaining stops'));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith([{ item_id: 't', deal_price: 36 }]));
  });
  it('percent helper never goes below ₹1', () => {
    expect(pctOff(40, 20)).toBe(32);
    expect(pctOff(1, 20)).toBe(1);
  });
});

const req = (o: Partial<VendorRequestRow>): VendorRequestRow => ({
  id: Math.random().toString(), item_id: 'drum', item_name: 'Drumsticks', free_text: null, qty: '500 g', note: null,
  buyer_first_name: 'Priya', society_name: 'Green Park Residency', status: 'open', default_unit: 'kg', last_price: 60, last_unit: 'kg',
  for_date: '2026-11-06', stop_id: 's1', slot_start: '2026-11-06T02:30:00Z', slot_end: '2026-11-06T03:15:00Z', gate_name: 'Gate 1', ...o,
});

describe('V-13 vendor requests (request flow v2)', () => {
  const evening = new Date('2026-11-05T11:00:00Z'); // 4:30 PM IST, the day before the visit
  const view = (rows: VendorRequestRow[], o: Partial<Parameters<typeof VendorRequestsView>[0]> = {}) => (
    <VendorRequestsView slots={groupBySlot(rows, evening)} loading={false} now={evening} tab="requests" onTab={jest.fn()} onAnswer={jest.fn(async () => undefined)} onShareQr={jest.fn()} {...o} />
  );
  it('groups by visit then item, with totals, notes and the visit header', async () => {
    await renderUi(view([req({}), req({ qty: '1 kg', buyer_first_name: 'Arjun', society_name: 'Sahyadri Heights', note: 'Fresh ones please' }), req({ item_id: 'b', item_name: 'Broccoli', qty: '1 piece' })]), { mode: 'vendor' });
    expect(screen.getByText('Tomorrow morning')).toBeTruthy();
    expect(screen.getByText('Drumsticks · 1.5 kg')).toBeTruthy();
    expect(screen.getByText('2 people · Green Park, Sahyadri Heights')).toBeTruthy();
    expect(screen.getByText('2 waiting for you')).toBeTruthy();
    await fireEvent.press(screen.getByText('Show notes (1)'));
    expect(screen.getByText('Arjun · Sahyadri Heights · 1 kg: “Fresh ones please”')).toBeTruthy();
  });
  it('Accept request sends the price (pre-filled from the menu, adjusted with the steppers)', async () => {
    const onAnswer = jest.fn(async () => undefined);
    await renderUi(view([req({})], { onAnswer }), { mode: 'vendor' });
    expect(screen.getByTestId('price-Drumsticks-value')).toHaveTextContent('₹60');
    await fireEvent.press(screen.getByTestId('price-Drumsticks-step-5'));
    await fireEvent.press(screen.getByText('Accept request'));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ status: 'will_bring', price: 55, unit: 'kg' })));
    expect(screen.getByText('Deny request')).toBeTruthy();
  });
  it('accepted item shows the price and the buyer counts; Deny after confirmations asks first', async () => {
    const onAnswer = jest.fn(async () => undefined);
    await renderUi(view([req({ status: 'accepted', quoted_price: 50, quoted_unit: 'kg' }), req({ status: 'will_bring', quoted_price: 50, quoted_unit: 'kg' })], { onAnswer }), { mode: 'vendor' });
    expect(screen.getByText('Accepted at about ₹50 / kg')).toBeTruthy();
    expect(screen.getByText('1 confirmed')).toBeTruthy();
    expect(screen.getByText('1 deciding')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('deny-Drumsticks'));
    expect(screen.getByText('1 buyer has confirmed. Deny anyway?')).toBeTruthy();
    expect(onAnswer).not.toHaveBeenCalled();
  });
  it('denied item can be accepted instead', async () => {
    await renderUi(view([req({ status: 'cant_bring' })]), { mode: 'vendor' });
    expect(screen.getByText('You denied this request')).toBeTruthy();
    await fireEvent.press(screen.getByText('Accept instead'));
    expect(screen.getByText('Accept request')).toBeTruthy();
  });
  it('Confirmed list: what to carry per visit, updated from confirmed orders', async () => {
    await renderUi(view([
      req({ status: 'accepted', quoted_price: 50, quoted_unit: 'kg', qty: '1 kg' }),
      req({ status: 'accepted', quoted_price: 50, quoted_unit: 'kg', qty: '500 g', buyer_first_name: 'Arjun' }),
      req({ status: 'will_bring', quoted_price: 50, quoted_unit: 'kg' }),
    ], { tab: 'confirmed' }), { mode: 'vendor' });
    expect(screen.getByTestId('vc-total')).toHaveTextContent('1.5 kg');
    expect(screen.getByText('2 orders · about ₹50 / kg')).toBeTruthy();
    expect(screen.getByText('Arjun · Green Park')).toBeTruthy();
  });
  it('tabs show counts and switch', async () => {
    const onTab = jest.fn();
    await renderUi(view([req({}), req({ item_id: 'b', item_name: 'Broccoli', status: 'accepted', quoted_price: 30 })], { onTab }), { mode: 'vendor' });
    expect(screen.getByText('Requests (1)')).toBeTruthy();
    await fireEvent.press(screen.getByText('Confirmed list (1)'));
    expect(onTab).toHaveBeenCalledWith('confirmed');
  });
  it('empty states for both tabs', async () => {
    const onShareQr = jest.fn();
    const r = await renderUi(view([], { onShareQr }));
    await fireEvent.press(screen.getByText('Share my QR'));
    expect(onShareQr).toHaveBeenCalled();
    await r.rerender(view([req({})], { tab: 'confirmed' }));
    expect(screen.getByText('No confirmed orders yet')).toBeTruthy();
  });
  it('load error offers retry', async () => {
    const onRetry = jest.fn();
    await renderUi(<VendorRequestsView slots={undefined} loading={false} tab="requests" onTab={jest.fn()} onAnswer={jest.fn()} onShareQr={jest.fn()} onRetry={onRetry} />);
    await fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
