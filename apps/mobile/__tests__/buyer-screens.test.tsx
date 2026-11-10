import { fireEvent, screen } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { HomeView } from '../src/features/buyer/HomeView';
import { VendorPageView } from '../src/features/buyer/VendorPageView';
import { FollowSheet } from '../src/features/buyer/FollowSheet';
import { SocietySwitcher } from '../src/features/buyer/SocietySwitcher';
import { SocietyPicker } from '../src/features/buyer/SocietyPicker';
import type { HomeVendor, MenuItemJson, SavedSociety } from '../src/features/buyer/types';
import type { VendorPage } from '../src/features/buyer/api';

const item = (name: string, o: Partial<MenuItemJson> = {}): MenuItemJson => ({ item_id: name, name, price: 40, unit: 'kg', sold_out: false, deal_price: null, deal_at: null, ...o });
const menu = (items: MenuItemJson[]) => ({ menu_id: 'm', published_at: '2026-11-05T01:12:00Z', updated_at: '2026-11-05T01:12:00Z', stock_photo_path: null, stock_photo_at: null, items });
const hv = (o: Partial<HomeVendor>): HomeVendor => ({
  vendor_id: 'r', stop_id: 's', gate_id: 'g', gate_name: 'Gate 1', window_start: '08:00:00', window_end: '08:45:00', status: 'expected', status_at: null,
  is_following: true, display_name: 'Ramesh Sabzi', photo_path: null, vehicle: 'tempo', delivery_available: true, avg_rating: 4.4, rating_count: 128,
  menu: menu([item('Tomato'), item('Onion', { price: 30 }), item('Methi', { price: 15, unit: 'bunch' })]), ...o,
});
const imran = hv({ vendor_id: 'i', display_name: 'Imran Vegetables', window_start: '18:00:00', window_end: '18:45:00', avg_rating: 3.9, rating_count: 41 });
const morning = new Date('2026-11-05T02:40:00Z');
const evening = new Date('2026-11-05T12:40:00Z');
const homeActions = { openVendor: jest.fn(), openDeals: jest.fn(), requestTomorrow: jest.fn(), tellUs: jest.fn(), switchSociety: jest.fn() };

describe('B-03 Home states', () => {
  it('morning with one vendor at the gate', async () => {
    await renderUi(<HomeView vendors={[hv({ status: 'at_gate', status_at: '2026-11-05T02:35:00Z' }), imran]} loading={false} now={morning} actions={homeActions} />);
    expect(screen.getByText('At the gate now')).toBeTruthy();
    expect(screen.getByText('At Gate 1 now · 4.4 ★')).toBeTruthy();
    expect(screen.getByText('View menu · 3 items')).toBeTruthy();
    expect(screen.getByText('Coming today')).toBeTruthy();
  });
  it('nobody at the gate yet', async () => {
    await renderUi(<HomeView vendors={[hv({}), imran]} loading={false} now={morning} actions={homeActions} />);
    expect(screen.getByText('No one at the gate right now. Next: Ramesh around 8:00 AM.')).toBeTruthy();
  });
  it('evening with deals', async () => {
    await renderUi(<HomeView vendors={[hv({ status: 'left', menu: menu([item('Tomato', { deal_price: 30 })]) }), { ...imran, status: 'at_gate' }]} loading={false} now={evening} actions={homeActions} />);
    expect(screen.getByTestId('deals-strip')).toBeTruthy();
    await fireEvent.press(screen.getByText('See deals'));
    expect(homeActions.openDeals).toHaveBeenCalled();
  });
  it('all vendors left for the day', async () => {
    await renderUi(<HomeView vendors={[hv({ status: 'left' }), { ...imran, status: 'left' }]} loading={false} now={evening} actions={homeActions} />);
    expect(screen.getByText('All vendors have left for today')).toBeTruthy();
    expect(screen.getByText('Request for tomorrow')).toBeTruthy();
  });
  it('no vendors serve this society', async () => {
    await renderUi(<HomeView vendors={[]} loading={false} now={morning} actions={homeActions} />);
    expect(screen.getByText('No vendors here yet')).toBeTruthy();
  });
  it('not coming today is collapsed', async () => {
    await renderUi(<HomeView vendors={[hv({}), { ...imran, status: 'not_coming' }]} loading={false} now={morning} actions={homeActions} />);
    expect(screen.queryByText('Imran Vegetables')).toBeNull();
    await fireEvent.press(screen.getByTestId('not-coming-toggle'));
    expect(screen.getByText('Imran Vegetables')).toBeTruthy();
  });
  it('loading skeleton', async () => {
    await renderUi(<HomeView vendors={undefined} loading now={morning} actions={homeActions} />);
    expect(screen.getByTestId('home-loading')).toBeTruthy();
  });
});

const page = (o: { allow_calls?: boolean; status?: HomeVendor['status']; items?: MenuItemJson[] | null; rating_count?: number; following?: boolean } = {}): VendorPage => ({
  available: true,
  vendor: {
    id: 'r', display_name: 'Ramesh Sabzi', photo_path: null, vehicle: 'tempo', delivery_available: true, allow_calls: o.allow_calls ?? true, code: 'RMSH4K7P',
    avg_rating: 4.4, rating_count: o.rating_count ?? 128, tag_counts: { fresh: 40, correct_weight: 22 }, stars_5: 80, stars_4: 30, stars_3: 10, stars_2: 5, stars_1: 3,
  },
  today: { status: o.status ?? 'at_gate', status_at: '2026-11-05T02:35:00Z', gate_name: 'Gate 1', window_start: '08:00:00', window_end: '08:45:00' },
  menu: o.items === null ? null : menu(o.items ?? [item('Tomato'), item('Coriander', { price: 10, unit: 'bunch', sold_out: true }), item('Onion', { price: 30, deal_price: 25 })]),
  stops: [{ stop_id: 's', society_id: 'gp', society_name: 'Green Park Residency', gate_id: 'g', gate_name: 'Gate 1', days_of_week: [1, 2, 3, 4, 5, 6, 7], window_start: '08:00:00', window_end: '08:45:00', skipped_today: false }],
  reviews: [{ id: 'rv', reviewer_name: 'Priya', society_name: 'Green Park Residency', stars: 5, tags: ['fresh'], text: 'Always fresh.', vendor_reply: 'Thank you, didi.', created_at: '2026-11-02T05:00:00Z', is_mine: false, status: 'visible', hidden_reason: null }],
  following: o.following ? [{ society_id: 'gp', notify_arrival: true, notify_deals: true, notify_requests: true }] : [],
});
const pageActions = { follow: jest.fn(), call: jest.fn(), openPhoto: jest.fn(), seeAllReviews: jest.fn(), requestTomorrow: jest.fn(), goHome: jest.fn(), openVendor: jest.fn() };

describe('B-05 vendor page', () => {
  it('at the gate with menu states (normal, sold out, deal)', async () => {
    await renderUi(<VendorPageView page={page()} loading={false} societyName="Green Park Residency" actions={pageActions} />);
    expect(screen.getByText('At Gate 1 now')).toBeTruthy();
    expect(screen.getByText('Sold out')).toBeTruthy();
    expect(screen.getByText('₹25 /kg')).toBeTruthy();
    expect(screen.getByText('Updated 6:42 AM')).toBeTruthy();
    expect(screen.getByText('Home delivery available')).toBeTruthy();
  });
  it('never shows a phone number; Call only when allow_calls is on', async () => {
    const r = await renderUi(<VendorPageView page={page({ allow_calls: false })} loading={false} actions={pageActions} />);
    expect(screen.queryByTestId('call-button')).toBeNull();
    expect(screen.queryByText(/\+91|\d{10}/)).toBeNull();
    await r.rerender(<VendorPageView page={page({ allow_calls: true })} loading={false} actions={pageActions} />);
    expect(screen.getByTestId('call-button')).toBeTruthy();
    expect(screen.queryByText(/\+91|\d{10}/)).toBeNull();
  });
  it.each([
    ['expected', 'Expected 8:00–8:45 AM'],
    ['leaving_soon', 'Leaving in 10 min'],
    ['left', 'Left at 8:05 AM'],
  ] as const)('%s', async (status, label) => {
    await renderUi(<VendorPageView page={page({ status })} loading={false} actions={pageActions} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
  it('not coming today offers vendors coming instead', async () => {
    await renderUi(<VendorPageView page={page({ status: 'not_coming' })} loading={false} societyName="Green Park" alternatives={[imran]} actions={pageActions} />);
    expect(screen.getByTestId('not-coming-card')).toBeTruthy();
    expect(screen.getByText('Coming instead')).toBeTruthy();
  });
  it('menu not published yet', async () => {
    await renderUi(<VendorPageView page={page({ items: null })} loading={false} actions={pageActions} />);
    expect(screen.getByText("Ramesh hasn't posted today's menu yet")).toBeTruthy();
  });
  it('everything sold out', async () => {
    await renderUi(<VendorPageView page={page({ items: [item('Tomato', { sold_out: true })] })} loading={false} actions={pageActions} />);
    expect(screen.getByTestId('all-sold-out')).toBeTruthy();
  });
  it('no photo today', async () => {
    await renderUi(<VendorPageView page={page()} loading={false} actions={pageActions} />);
    expect(screen.getByTestId('no-photo')).toBeTruthy();
  });
  it('new vendor with no ratings', async () => {
    await renderUi(<VendorPageView page={page({ rating_count: 0 })} loading={false} actions={pageActions} />);
    expect(screen.getByText('New on Pheri')).toBeTruthy();
    expect(screen.getByTestId('no-reviews')).toBeTruthy();
  });
  it('search when more than 12 items', async () => {
    await renderUi(<VendorPageView page={page({ items: Array.from({ length: 13 }, (_, i) => item(`Item ${i}`)) })} loading={false} actions={pageActions} />);
    await fireEvent.changeText(screen.getByTestId('menu-search'), 'Item 12');
    expect(screen.queryByText('Item 3')).toBeNull();
    expect(screen.getByText('Item 12')).toBeTruthy();
  });
  it('loading and suspended (unavailable)', async () => {
    const r = await renderUi(<VendorPageView page={undefined} loading actions={pageActions} />);
    expect(screen.getByTestId('vendor-loading')).toBeTruthy();
    await r.rerender(<VendorPageView page={{ available: false }} loading={false} societyName="Green Park" actions={pageActions} />);
    expect(screen.getByText("This vendor isn't available any more")).toBeTruthy();
  });
  it('following and first-run coach mark', async () => {
    const r = await renderUi(<VendorPageView page={page()} loading={false} actions={pageActions} coach onCoachDone={jest.fn()} />);
    expect(screen.getByTestId('coach-mark')).toBeTruthy();
    await r.rerender(<VendorPageView page={page({ following: true })} loading={false} actions={pageActions} coach />);
    expect(screen.getByText('Following')).toBeTruthy();
    expect(screen.queryByTestId('coach-mark')).toBeNull();
  });
});

const saved = (name: string, primary = false): SavedSociety => ({ id: name, name, area: 'karve_nagar', address: '', lat: 18.49, lng: 73.82, flats_count: 100, is_primary: primary });

describe('B-07 follow sheet', () => {
  it('pre-selects current society and follows with prefs', async () => {
    const onFollow = jest.fn(async () => undefined);
    await renderUi(<FollowSheet visible vendorName="Ramesh Sabzi" societies={[saved('gp', true), saved('sh')]} servedSocietyIds={['gp', 'sh']} defaultSociety="gp" notificationsBlocked={false} onTurnOn={jest.fn()} onFollow={onFollow} following={false} onClose={jest.fn()} />);
    expect(screen.getByText('Follow Ramesh at which society?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('switch', { name: 'Evening deals' }));
    await fireEvent.press(screen.getByTestId('confirm-follow'));
    expect(onFollow).toHaveBeenCalledWith('gp', { notify_arrival: true, notify_deals: false, notify_requests: true });
  });
  it('warns when notifications are blocked', async () => {
    await renderUi(<FollowSheet visible vendorName="Ramesh" societies={[saved('gp')]} servedSocietyIds={['gp']} defaultSociety="gp" notificationsBlocked onTurnOn={jest.fn()} onFollow={jest.fn()} following={false} onClose={jest.fn()} />);
    expect(screen.getByTestId('follow-notif-blocked')).toBeTruthy();
  });
});

describe('B-04 society switcher', () => {
  it('1 saved', async () => {
    await renderUi(<SocietySwitcher visible onClose={jest.fn()} societies={[saved('Green Park', true)]} current="Green Park" onPick={jest.fn()} onMakePrimary={jest.fn()} onRemove={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByTestId('add-society').props.accessibilityState.disabled).toBe(false);
  });
  it('3 saved disables add with a hint', async () => {
    await renderUi(<SocietySwitcher visible onClose={jest.fn()} societies={[saved('A', true), saved('B'), saved('C')]} current="A" onPick={jest.fn()} onMakePrimary={jest.fn()} onRemove={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByTestId('add-society').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('You can save up to 3. Remove one to add another.')).toBeTruthy();
  });
});

describe('B-01 society picker', () => {
  const socs = [
    { id: 'gp', name: 'Green Park Residency', area: 'karve_nagar' as const, address: '', lat: 18.4895, lng: 73.8215, flats_count: 420 },
    { id: 'tv', name: 'Tulsi Vihar', area: 'sus_pashan' as const, address: '', lat: 18.5372, lng: 73.7905, flats_count: 310 },
  ];
  it('results sorted by distance near you', async () => {
    await renderUi(<SocietyPicker societies={socs} loading={false} position={{ lat: 18.537, lng: 73.79 }} locating={false} locationOff={false} onPick={jest.fn()} onNotListed={jest.fn()} />);
    expect(screen.getByText('Near you')).toBeTruthy();
    expect(screen.getAllByText(/away/)[0]!.props.children).toMatch(/Sus–Pashan/);
  });
  it('location off (search only) and no search results', async () => {
    const onNotListed = jest.fn();
    await renderUi(<SocietyPicker societies={socs} loading={false} position={null} locating={false} locationOff onPick={jest.fn()} onNotListed={onNotListed} />);
    expect(screen.getByTestId('loc-off')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('society-search'), 'Rohan');
    expect(screen.getByText("No society called 'Rohan'")).toBeTruthy();
  });
  it('loading nearby', async () => {
    await renderUi(<SocietyPicker societies={[]} loading position={null} locating locationOff={false} onPick={jest.fn()} onNotListed={jest.fn()} />);
    expect(screen.getByText('Finding societies near you…')).toBeTruthy();
  });
});
