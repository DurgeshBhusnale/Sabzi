import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { groupRequests, type RequestLite } from '@sabzi/shared';
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

const req = (o: Partial<RequestLite>): RequestLite => ({ id: Math.random().toString(), item_id: 'drum', item_name: 'Drumsticks', free_text: null, qty: '500 g', note: null, buyer_first_name: 'Priya', society_name: 'Green Park', status: 'open', ...o });

describe('V-13 vendor requests', () => {
  const evening = new Date('2026-11-05T11:00:00Z'); // 4:30 PM IST
  const morning = new Date('2026-11-05T03:00:00Z'); // 8:30 AM IST
  it('groups by item with summed quantity and answers per item', async () => {
    const onAnswer = jest.fn(async () => undefined);
    const groups = groupRequests([req({}), req({ qty: '1 kg', buyer_first_name: 'Arjun', society_name: 'Sahyadri Heights', note: 'Fresh ones please' }), req({ item_id: 'b', item_name: 'Broccoli', qty: '1 piece' })]);
    await renderUi(<VendorRequestsView groups={groups} loading={false} dateLabel="Friday, 6 November" now={evening} onAnswer={onAnswer} onShareQr={jest.fn()} />, { mode: 'vendor' });
    expect(screen.getByText('Drumsticks · 1.5 kg')).toBeTruthy();
    expect(screen.getByText('2 buyers · Green Park, Sahyadri Heights')).toBeTruthy();
    await fireEvent.press(screen.getByText('Show notes'));
    expect(screen.getByText('Arjun · Sahyadri Heights · 1 kg: "Fresh ones please"')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('will-Drumsticks'));
    expect(onAnswer).toHaveBeenCalledWith('drum', 'will_bring');
    expect(screen.queryByTestId('vr-before-4')).toBeNull();
  });
  it('before 4 PM shows requests so far', async () => {
    await renderUi(<VendorRequestsView groups={groupRequests([req({})])} loading={false} dateLabel="Friday" now={morning} onAnswer={jest.fn()} onShareQr={jest.fn()} />);
    expect(screen.getByTestId('vr-before-4')).toBeTruthy();
  });
  it('all answered', async () => {
    await renderUi(<VendorRequestsView groups={groupRequests([req({ status: 'will_bring' }), req({ item_id: 'b', item_name: 'Broccoli', status: 'cant_bring' })])} loading={false} dateLabel="Friday" now={evening} onAnswer={jest.fn()} onShareQr={jest.fn()} />);
    expect(screen.getByText('All 2 requests answered. Buyers have been told.')).toBeTruthy();
  });
  it('no requests', async () => {
    const onShareQr = jest.fn();
    await renderUi(<VendorRequestsView groups={[]} loading={false} dateLabel="Friday" now={evening} onAnswer={jest.fn()} onShareQr={onShareQr} />);
    await fireEvent.press(screen.getByText('Share my QR'));
    expect(onShareQr).toHaveBeenCalled();
  });
});
