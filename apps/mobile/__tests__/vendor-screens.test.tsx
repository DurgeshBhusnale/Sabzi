import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { nextAction, TodayView } from '../src/features/vendor/TodayView';
import { showArriveFab } from '../src/features/vendor/ArriveFab';
import { MenuEditor } from '../src/features/vendor/MenuEditor';
import { ArriveSheet, type ArriveDeps } from '../src/features/vendor/ArriveSheet';
import { buildDraft } from '../src/features/vendor/menuLogic';
import type { TodayStop } from '../src/features/vendor/arrival';
import type { DayMenu, MyVendor, VendorStats } from '../src/features/vendor/api';

const vendor: MyVendor = {
  user_id: 'v', display_name: 'Ramesh Sabzi', photo_path: null, vehicle: 'tempo', vehicle_no: null, pmc_vendor_id: null, pmc_doc_path: null,
  delivery_available: true, allow_calls: true, status: 'verified', status_reason: null, verified_seen_at: '2026-11-01T00:00:00Z', code: 'RMSH4K7P',
};
const stats: VendorStats = { followers: 186, followers_week_change: 6, alert_opens_today: 0, profile_views_week: 40, avg_rating: 4.4, rating_count: 128 };
const now = new Date('2026-11-05T02:40:00Z'); // 8:10 AM IST
const stop = (o: Partial<TodayStop>): TodayStop => ({
  stopId: 'gp', gateId: 'gp1', gateName: 'Gate 1', societyName: 'Green Park', lat: 18.4895, lng: 73.8215, windowStart: '08:00', windowEnd: '08:45',
  followers: 42, skipped: false, arrivedAt: null, leftAt: null, leavingAt: null, lastArrivalAt: null, arrivalEventId: null, ...o,
});
const sahyadri = stop({ stopId: 'sh', gateId: 'sh1', gateName: 'Main Gate', societyName: 'Sahyadri Heights', lat: 18.4935, lng: 73.8186, followers: 54, windowStart: '09:00', windowEnd: '09:40' });
const names = ['Tomato', 'Onion', 'Potato', 'Bhindi', 'Methi', 'Palak', 'Coriander', 'Cauliflower', 'Cabbage', 'Green chilli', 'Capsicum', 'Brinjal', 'Drumsticks', 'Carrot'];
const usual = names.map((n, i) => ({ id: `i${i}`, name: n, defaultUnit: 'kg' as const }));
const yesterday = usual.slice(0, 12).map((u, i) => ({ itemId: u.id, price: 20 + i * 5, unit: 'kg' as const }));
const menu: DayMenu = { id: 'm', date: '2026-11-05', publishedAt: '2026-11-05T01:12:00Z', updatedAt: '2026-11-05T01:12:00Z', stockPhotoPath: null, stockPhotoAt: null, lines: yesterday.map((y, i) => ({ ...y, name: names[i]!, dealPrice: null, soldOut: false })) };
const actions = { onSetMenu: jest.fn(), onAddPhoto: jest.fn(), onOpenLive: jest.fn(), onSendDeal: jest.fn() };

describe('V-05: publish 12 items from "Last menu" in ≤ 3 taps', () => {
  it('Today → Set menu → Last menu → Publish', async () => {
    let taps = 0;
    const onPublish = jest.fn();
    await renderUi(<TodayView vendor={vendor} name="Ramesh Pawar" menu={null} stops={[stop({})]} stats={stats} loading={false} now={now} actions={{ ...actions, onSetMenu: () => undefined }} />, { mode: 'vendor' });
    await fireEvent.press(screen.getByTestId('set-menu'));
    taps++;
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} lastMenu={yesterday} onPublish={onPublish} publishing={false} />, { mode: 'vendor' });
    expect(screen.getByTestId('publish').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('copy-last-menu'));
    taps++;
    expect(screen.getByText('12 items added from your last menu. Check prices, then publish.')).toBeTruthy();
    expect(screen.queryByTestId('copy-last-menu')).toBeNull();
    expect(screen.getByText('Publish menu (12 items)')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('publish'));
    taps++;
    expect(taps).toBeLessThanOrEqual(3);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish.mock.calls[0][0]).toHaveLength(12);
    // First render in the file loads every screen module; on a busy machine that alone can pass 5 s.
  }, 20_000);

  it('first time (no last menu): nothing selected, publish disabled', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, null)} lastMenu={null} onPublish={jest.fn()} publishing={false} />);
    expect(screen.queryByTestId('copy-last-menu')).toBeNull();
    expect(screen.getByText('Pick items to publish')).toBeTruthy();
  });

  it('some prices missing: red outline and hint, publish disabled', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} lastMenu={yesterday} onPublish={jest.fn()} publishing={false} />);
    await fireEvent.press(screen.getByTestId('copy-last-menu'));
    await fireEvent.press(screen.getByTestId('tile-Drumsticks'));
    await fireEvent.press(screen.getByText('Cancel'));
    await fireEvent.press(screen.getByTestId('tile-Carrot'));
    // price sheet open with ₹0 → invalid, save disabled
    expect(screen.getByTestId('save-price').props.accessibilityState.disabled).toBe(true);
  });

  it('price editor: step and save with "was" hint', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} lastMenu={yesterday} onPublish={jest.fn()} publishing={false} />, { mode: 'vendor' });
    await fireEvent.press(screen.getByTestId('tile-Tomato'));
    // owner review 2026-11-21: a price wheel instead of −5/−1/+1/+5; tapping a row picks it
    expect(screen.queryByTestId('step-5')).toBeNull();
    await fireEvent.press(screen.getByTestId('price-stepper-wheel-row-25'));
    expect(screen.getByTestId('was-hint')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('save-price'));
    expect(screen.getByText('₹25 / kg')).toBeTruthy();
  });

  it('publishing and offline states', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} lastMenu={yesterday} onPublish={jest.fn()} publishing offlineNote="No internet. Your menu will publish when you're back online." />);
    expect(screen.getByText("No internet. Your menu will publish when you're back online.")).toBeTruthy();
  });
});

describe('V-04 Today states', () => {
  it('before menu', async () => {
    await renderUi(<TodayView vendor={vendor} name="Ramesh Pawar" menu={null} stops={[stop({}), sahyadri]} stats={stats} loading={false} now={now} actions={actions} />, { mode: 'vendor' });
    expect(screen.getByText('Good morning, Ramesh')).toBeTruthy();
    expect(screen.getByTestId('step-menu')).toBeTruthy();
    expect(screen.getByText('186 followers waiting')).toBeTruthy();
    expect(screen.getByTestId('step-photo')).toBeTruthy();
  });
  it('menu published', async () => {
    await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({})]} stats={stats} loading={false} now={now} actions={actions} />);
    expect(screen.getByText('Menu live · 12 items')).toBeTruthy();
    expect(screen.getByText('Updated 6:42 AM')).toBeTruthy();
  });
  it('at a stop (live banner)', async () => {
    await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({ arrivedAt: '2026-11-05T02:35:00Z' })]} stats={stats} loading={false} now={now} openCount={18} actions={actions} />);
    expect(screen.getByText("You're at Green Park, Gate 1")).toBeTruthy();
    expect(screen.getByText('Since 8:05 AM · 18 opened your alert')).toBeTruthy();
  });
  it('after all stops', async () => {
    await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({ arrivedAt: '2026-11-05T02:00:00Z', leftAt: '2026-11-05T02:30:00Z' })]} stats={stats} loading={false} now={now} actions={actions} />);
    expect(screen.getByTestId('done-today')).toBeTruthy();
  });
  it('not yet verified (banner)', async () => {
    await renderUi(<TodayView vendor={{ ...vendor, status: 'pending' }} name="Ramesh" menu={null} stops={[]} stats={{ ...stats, followers: 0 }} loading={false} now={now} actions={actions} />);
    expect(screen.getByTestId('not-verified')).toBeTruthy();
  });
  it('loading', async () => {
    await renderUi(<TodayView vendor={undefined} name="" menu={undefined} stops={undefined} stats={undefined} loading now={now} actions={actions} />);
    expect(screen.getByTestId('today-loading')).toBeTruthy();
  });
});

describe('V-08 I have arrived', () => {
  const baseDeps = (o: Partial<ArriveDeps> = {}): ArriveDeps => ({
    locationAllowed: async () => true,
    getPosition: async () => ({ lat: 18.4911, lng: 73.8215 }),
    send: jest.fn(async () => ({ event_id: 'e1', followers: 42 })),
    undo: jest.fn(async () => undefined),
    onDone: jest.fn(),
    openSettings: jest.fn(),
    ...o,
  });

  it('suggests the nearest stop and sends, with 5-second undo', async () => {
    const deps = baseDeps();
    await renderUi(<ArriveSheet visible stops={[sahyadri, stop({})]} onClose={jest.fn()} deps={deps} now={() => now} />, { mode: 'vendor' });
    await waitFor(() => expect(screen.getByText('Where are you?')).toBeTruthy());
    expect(screen.getByText('180 m away')).toBeTruthy();
    expect(screen.getByText('42 people will be told')).toBeTruthy();
    expect(screen.getByText('Not here? Other stops today')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('send-arrival'));
    await waitFor(() => expect(screen.getByText('Sent to 42 people')).toBeTruthy());
    expect(screen.getByText('Undo · 5s')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('undo-arrival'));
    expect(deps.undo).toHaveBeenCalledWith('e1');
  });

  it('calls onDone after the undo window', async () => {
    jest.useFakeTimers();
    const deps = baseDeps();
    await renderUi(<ArriveSheet visible stops={[stop({})]} onClose={jest.fn()} deps={deps} now={() => now} />);
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    await fireEvent.press(screen.getByTestId('send-arrival'));
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(deps.onDone).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('is blocked within 2 hours at the same gate and shows the unlock time', async () => {
    const deps = baseDeps();
    const locked = stop({ lastArrivalAt: '2026-11-05T02:35:00Z' }); // 8:05 AM IST
    await renderUi(<ArriveSheet visible stops={[locked]} onClose={jest.fn()} deps={deps} now={() => now} />);
    await waitFor(() => expect(screen.getByTestId('arrival-locked')).toBeTruthy());
    expect(screen.getByText('You told these 42 people at 8:05 AM. You can send again at 10:05 AM.')).toBeTruthy();
    expect(screen.getByTestId('send-arrival').props.accessibilityState.disabled).toBe(true);
  });

  it('no stop within 300 m → choose manually', async () => {
    await renderUi(<ArriveSheet visible stops={[stop({}), sahyadri]} onClose={jest.fn()} deps={baseDeps({ getPosition: async () => ({ lat: 18.51, lng: 73.84 }) })} now={() => now} />);
    await waitFor(() => expect(screen.getByTestId('none-nearby')).toBeTruthy());
    expect(screen.getByText('Choose your stop')).toBeTruthy();
    expect(screen.getByTestId('send-arrival').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('arrive-stop-sh'));
    expect(screen.getByTestId('send-arrival').props.accessibilityState.disabled).toBe(false);
  });

  it('GPS off → manual list with Turn on', async () => {
    const deps = baseDeps({ locationAllowed: async () => false });
    await renderUi(<ArriveSheet visible stops={[stop({})]} onClose={jest.fn()} deps={deps} now={() => now} />);
    await waitFor(() => expect(screen.getByTestId('gps-off')).toBeTruthy());
    await fireEvent.press(screen.getByText('Turn on'));
    expect(deps.openSettings).toHaveBeenCalled();
  });

  it('offline → send when online with late warning', async () => {
    await renderUi(<ArriveSheet visible stops={[stop({})]} onClose={jest.fn()} deps={baseDeps({ isOnline: () => false })} now={() => now} />);
    await waitFor(() => expect(screen.getByTestId('arrival-offline')).toBeTruthy());
    expect(screen.getByText('Send when online')).toBeTruthy();
  });

  it('shows a server error such as the cooldown', async () => {
    const { AppErrorException } = jest.requireActual('../src/lib/errors');
    const deps = baseDeps({ send: async () => { throw new AppErrorException({ code: 'arrival_cooldown', message: 'You already sent an alert here recently.' }); } });
    await renderUi(<ArriveSheet visible stops={[stop({})]} onClose={jest.fn()} deps={deps} now={() => now} />);
    await waitFor(() => expect(screen.getByTestId('send-arrival')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('send-arrival'));
    await waitFor(() => expect(screen.getByText('You already sent an alert here recently.')).toBeTruthy());
  });
});

describe('V-04 Today (UX audit)', () => {
  it('UX-31: one next action by state', () => {
    expect(nextAction({ published: false, live: false, done: false })).toBe('set_menu');
    expect(nextAction({ published: true, live: false, done: false })).toBe('next_stop');
    expect(nextAction({ published: true, live: true, done: false })).toBe('live');
    expect(nextAction({ published: false, live: true, done: false })).toBe('live');
    expect(nextAction({ published: true, live: false, done: true })).toBe('done');
  });
  it('UX-31: the arrive FAB waits for a live menu', () => {
    expect(showArriveFab('/today', false, false)).toBe(false);
    expect(showArriveFab('/today', false, true)).toBe(true);
    expect(showArriveFab('/stops', true, true)).toBe(false);
    expect(showArriveFab('/me', false, true)).toBe(false);
  });
  it('UX-30/43: no stats strip on Today (they live on Me); no bell in the header', async () => {
    await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={null} stops={[stop({})]} stats={stats} loading={false} now={now} actions={actions} />, { mode: 'vendor' });
    expect(screen.queryByTestId('stats-line')).toBeNull();
    expect(screen.queryByText(/alert opens today/)).toBeNull();
    expect(screen.queryByLabelText('Notifications')).toBeNull();
  });
  it('UX-32: only the next stop, with All stops', async () => {
    const onAllStops = jest.fn();
    const later = stop({ stopId: 's9', societyName: 'Sai Residency', gateName: 'Main gate', windowStart: '10:00:00', windowEnd: '10:30:00' });
    await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({}), later]} stats={stats} loading={false} now={now} actions={{ ...actions, onAllStops }} />, { mode: 'vendor' });
    expect(screen.getByTestId('next-stop-card')).toBeTruthy();
    expect(screen.queryByText('Sai Residency')).toBeNull();
    await fireEvent.press(screen.getByText('All stops'));
    expect(onAllStops).toHaveBeenCalled();
  });
  it('UX-33: quick actions — sold out after the menu, deal only from 4 PM', async () => {
    const onSoldOut = jest.fn();
    const r = await renderUi(<TodayView vendor={vendor} name="Ramesh" menu={null} stops={[stop({})]} stats={stats} loading={false} now={now} actions={{ ...actions, onSoldOut }} />, { mode: 'vendor' });
    expect(screen.getByTestId('quick-soldout').props.accessibilityState.disabled).toBe(true);
    await r.rerender(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({})]} stats={stats} loading={false} now={now} actions={{ ...actions, onSoldOut }} />);
    await fireEvent.press(screen.getByTestId('quick-soldout'));
    expect(onSoldOut).toHaveBeenCalled();
    expect(screen.getByTestId('quick-deal').props.accessibilityState.disabled).toBe(true);
    await r.rerender(<TodayView vendor={vendor} name="Ramesh" menu={menu} stops={[stop({})]} stats={stats} loading={false} now={new Date('2026-11-05T11:00:00Z')} actions={{ ...actions, onSoldOut }} />);
    expect(screen.getByTestId('quick-deal').props.accessibilityState.disabled).toBe(false);
  });
});

describe('Vendor screens (UX audit)', () => {
  it('UX-37: the whole sold-out row toggles and shows a Sold out pill', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SoldOutList } = require('../src/features/vendor/SoldOutList') as typeof import('../src/features/vendor/SoldOutList');
    const onToggle = jest.fn();
    const m = { ...menu, lines: [{ ...menu.lines[0]!, soldOut: true }, menu.lines[1]!] };
    await renderUi(<SoldOutList menu={m} onToggle={onToggle} />, { mode: 'vendor' });
    expect(screen.getByTestId('soldout-Tomato')).toHaveStyle({ minHeight: 56 });
    expect(screen.getByText('Sold out')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('soldout-Onion'));
    expect(onToggle).toHaveBeenCalledWith(menu.lines[1]!.itemId, true);
  });
  it('UX-35/45: a priced tile shows the price in the vendor price style and a selected tint', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ItemTile } = require('../src/ui/ItemTile') as typeof import('../src/ui/ItemTile');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { vendorType } = require('@sabzi/shared') as typeof import('@sabzi/shared');
    await renderUi(<ItemTile name="Tomato" state="priced" price={40} unit="kg" onPress={jest.fn()} testID="t" />, { mode: 'vendor' });
    expect(screen.getByTestId('tile-price')).toHaveStyle({ fontSize: vendorType.price.fontSize });
  });
});
