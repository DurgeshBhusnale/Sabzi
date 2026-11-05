import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { TodayView } from '../src/features/vendor/TodayView';
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

describe('V-05: publish 12 items from "Same as yesterday" in ≤ 3 taps', () => {
  it('Today → Set menu → Yesterday → Publish', async () => {
    let taps = 0;
    const onPublish = jest.fn();
    await renderUi(<TodayView vendor={vendor} name="Ramesh Pawar" menu={null} stops={[stop({})]} stats={stats} loading={false} now={now} actions={{ ...actions, onSetMenu: () => undefined }} />, { mode: 'vendor' });
    await fireEvent.press(screen.getByTestId('set-menu'));
    taps++;
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} yesterday={yesterday} onPublish={onPublish} publishing={false} />, { mode: 'vendor' });
    expect(screen.getByTestId('publish').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('same-as-yesterday'));
    taps++;
    expect(screen.getByText('Copied 12 items from yesterday')).toBeTruthy();
    expect(screen.getByText('Publish menu (12 items)')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('publish'));
    taps++;
    expect(taps).toBeLessThanOrEqual(3);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish.mock.calls[0][0]).toHaveLength(12);
  });

  it('first time (no yesterday): nothing selected, publish disabled', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, null)} yesterday={null} onPublish={jest.fn()} publishing={false} />);
    expect(screen.queryByTestId('same-as-yesterday')).toBeNull();
    expect(screen.getByText('Pick items to publish')).toBeTruthy();
  });

  it('some prices missing: red outline and hint, publish disabled', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} yesterday={yesterday} onPublish={jest.fn()} publishing={false} />);
    await fireEvent.press(screen.getByTestId('same-as-yesterday'));
    await fireEvent.press(screen.getByTestId('tile-Drumsticks'));
    await fireEvent.press(screen.getByText('Cancel'));
    await fireEvent.press(screen.getByTestId('tile-Carrot'));
    // price sheet open with ₹0 → invalid, save disabled
    expect(screen.getByTestId('save-price').props.accessibilityState.disabled).toBe(true);
  });

  it('price editor: step and save with "was" hint', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} yesterday={yesterday} onPublish={jest.fn()} publishing={false} />, { mode: 'vendor' });
    await fireEvent.press(screen.getByTestId('tile-Tomato'));
    await fireEvent.press(screen.getByTestId('step-5'));
    expect(screen.getByTestId('was-hint')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('save-price'));
    expect(screen.getByText('₹25 / kg')).toBeTruthy();
  });

  it('publishing and offline states', async () => {
    await renderUi(<MenuEditor initial={buildDraft(usual, null, yesterday)} yesterday={yesterday} onPublish={jest.fn()} publishing offlineNote="No internet. Your menu will publish when you're back online." />);
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
    expect(screen.getByText('Live at Green Park, Gate 1')).toBeTruthy();
    expect(screen.getByText('since 8:05 AM · 18 opened')).toBeTruthy();
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
