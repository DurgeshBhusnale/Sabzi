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
    <VendorRequestsView slots={groupBySlot(rows, evening)} loading={false} now={evening} tab="requests" onTab={jest.fn()} onAnswer={jest.fn(async () => undefined)} onMark={jest.fn(async () => undefined)} onShareQr={jest.fn()} {...o} />
  );
  it('groups by visit then item, with totals, notes and the visit header', async () => {
    await renderUi(view([req({ buyer_name: 'Priya Kulkarni' }), req({ qty: '1 kg', buyer_first_name: 'Arjun', buyer_name: 'Arjun Mehta', society_name: 'Sahyadri Heights', note: 'Fresh ones please' }), req({ item_id: 'b', item_name: 'Broccoli', qty: '1 piece' })]), { mode: 'vendor' });
    expect(screen.getByText('Tomorrow morning')).toBeTruthy();
    expect(screen.getByText('Drumsticks · 1.5 kg')).toBeTruthy();
    expect(screen.getByText('2 people · Green Park, Sahyadri Heights')).toBeTruthy();
    expect(screen.getByText('2 waiting for you')).toBeTruthy();
    // owner review 2026-11-21: every buyer by full name, with society, quantity and note
    expect(screen.getByText('Priya Kulkarni')).toBeTruthy();
    expect(screen.getByText('Arjun Mehta')).toBeTruthy();
    expect(screen.getByText('Sahyadri Heights · 1 kg')).toBeTruthy();
    expect(screen.getByText('“Fresh ones please”')).toBeTruthy();
  });
  it('Accept request sends the price (pre-filled from the menu, changed on the price wheel) and the note', async () => {
    const onAnswer = jest.fn(async () => undefined);
    await renderUi(view([req({})], { onAnswer }), { mode: 'vendor' });
    expect(screen.getByTestId('price-Drumsticks-value')).toHaveTextContent('₹60');
    expect(screen.queryByTestId('price-Drumsticks-step-5')).toBeNull();
    await fireEvent.press(screen.getByTestId('price-Drumsticks-open'));
    await fireEvent.press(screen.getByTestId('price-Drumsticks-stepper-wheel-row-55'));
    await fireEvent.press(screen.getByTestId('price-Drumsticks-done'));
    expect(screen.getByTestId('price-Drumsticks-value')).toHaveTextContent('₹55');
    await fireEvent.changeText(screen.getByTestId('vnote-Drumsticks'), 'Fresh stock, may be 10 min late');
    await fireEvent.press(screen.getByText('Accept request'));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ status: 'will_bring', price: 55, unit: 'kg', note: 'Fresh stock, may be 10 min late' })));
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
    expect(screen.getByText('You can mark these from 7:00 AM.')).toBeTruthy();
    expect(screen.getByText('Arjun · Green Park')).toBeTruthy();
    expect(screen.getByText('What to carry')).toBeTruthy();
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
    await renderUi(<VendorRequestsView slots={undefined} loading={false} tab="requests" onTab={jest.fn()} onAnswer={jest.fn()} onMark={jest.fn()} onShareQr={jest.fn()} onRetry={onRetry} />);
    await fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('V-13 Confirmed list: delivery (last step)', () => {
  const during = new Date('2026-11-06T02:45:00Z'); // 8:15 AM IST, during the 8:00 visit
  const view = (rows: VendorRequestRow[], onMark = jest.fn(async () => undefined), now = during) => (
    <VendorRequestsView slots={groupBySlot(rows, now)} loading={false} now={now} tab="confirmed" onTab={jest.fn()} onAnswer={jest.fn()} onMark={onMark} onShareQr={jest.fn()} />
  );
  const ok = (o: Partial<VendorRequestRow>) => req({ status: 'accepted', quoted_price: 50, quoted_unit: 'kg', ...o });
  it('each order has Delivered and Not delivered buttons; Delivered marks all of that buyer\u2019s items', async () => {
    const onMark = jest.fn(async () => undefined);
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p' }), ok({ id: 'b', buyer_ref: 'p', item_id: 'o', item_name: 'Onion' }), ok({ id: 'c', buyer_ref: 'r', buyer_first_name: 'Arjun' })], onMark), { mode: 'vendor' });
    expect(screen.getByTestId('not-deliver-Priya')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('deliver-Priya'));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith(['a', 'b'], 'delivered', undefined));
    expect(screen.getByText('Undo')).toBeTruthy();
  });
  it('Not delivered asks for a reason in one tap', async () => {
    const onMark = jest.fn(async () => undefined);
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p' })], onMark), { mode: 'vendor' });
    await fireEvent.press(screen.getByTestId('not-deliver-Priya'));
    expect(onMark).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Buyer wasn't there"));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith(['a'], 'not_delivered', 'buyer_not_there'));
  });
  it('Mark all delivered for the visit', async () => {
    const onMark = jest.fn(async () => undefined);
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p' }), ok({ id: 'c', buyer_ref: 'r', buyer_first_name: 'Arjun' })], onMark), { mode: 'vendor' });
    await fireEvent.press(screen.getByText('Mark all 2 delivered'));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith(['c', 'a'], 'delivered', undefined));
  });
  it('shows the recorded result with Change', async () => {
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p', status: 'not_delivered', missed_reason: 'vendor_unavailable', delivered_at: '2026-11-06T02:40:00Z' })]), { mode: 'vendor' });
    expect(screen.getByText("Not delivered · I couldn't get it")).toBeTruthy();
    expect(screen.getByTestId('change-Priya')).toBeTruthy();
  });
  it('before the visit the buttons wait, with the time they open', async () => {
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p' })], jest.fn(), new Date('2026-11-05T11:00:00Z')), { mode: 'vendor' });
    expect(screen.queryByTestId('deliver-Priya')).toBeNull();
    expect(screen.getByText('You can mark these from 7:00 AM.')).toBeTruthy();
  });
  it('filter by visit (society + day)', async () => {
    const other = { stop_id: 's2', gate_name: 'Main Gate', society_name: 'Sahyadri Heights', slot_start: '2026-11-06T03:30:00Z', slot_end: '2026-11-06T04:10:00Z', buyer_first_name: 'Meera', buyer_ref: 'm' };
    await renderUi(view([ok({ id: 'a', buyer_ref: 'p' }), ok({ id: 'm', ...other })]), { mode: 'vendor' });
    expect(screen.getByTestId('order-Priya')).toBeTruthy();
    expect(screen.queryByTestId('order-Meera')).toBeNull();
    await fireEvent.press(screen.getByText('All visits'));
    expect(screen.getByTestId('order-Meera')).toBeTruthy();
  });
});
