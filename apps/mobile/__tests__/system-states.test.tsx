import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { appStatus, compareVersions } from '../src/lib/version';
import { isNetworkError, toNetwork } from '../src/lib/offline/network';
import { PendingList } from '../src/features/system/PendingActions';
import { ArriveSheet } from '../src/features/vendor/ArriveSheet';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
// eslint-disable-next-line import/first
import DevStates, { X_SCREENS } from '../app/_dev/states';

describe('every X-xx screen is reachable from the dev route', () => {
  it('lists X-01 … X-17', () => {
    expect(X_SCREENS.map((x) => x.id)).toEqual(Array.from({ length: 17 }, (_, i) => `X-${String(i + 1).padStart(2, '0')}`));
  });
  it.each(Array.from({ length: 17 }, (_, i) => `X-${String(i + 1).padStart(2, '0')}`))('%s opens', async (id) => {
    await renderUi(<DevStates />);
    await fireEvent.press(screen.getByTestId(`open-${id}`));
    expect(screen.getAllByTestId(new RegExp(`^${id.toLowerCase().replace('-', '')}`)).length).toBeGreaterThan(0);
  });
});

describe('force update and maintenance (X-11 / X-12 / X-13)', () => {
  it('compares versions', () => {
    expect(compareVersions('0.1.0', '0.2.0')).toBe(-1);
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });
  it('maps app_settings to a status', () => {
    expect(appStatus('0.1.0', { min_app_version: '0.2.0' }).kind).toBe('force_update');
    expect(appStatus('0.2.0', { min_app_version: '0.1.0', latest_app_version: '0.3.0' }).kind).toBe('optional_update');
    expect(appStatus('0.3.0', { min_app_version: '0.1.0', latest_app_version: '0.3.0' }).kind).toBe('ok');
    expect(appStatus('0.1.0', { min_app_version: '0.2.0', maintenance: { enabled: true, until: '6:00 AM' } })).toEqual({ kind: 'maintenance', until: '6:00 AM' });
  });
});

describe('network (X-02 / X-03)', () => {
  it('detects offline and weak connections', () => {
    expect(toNetwork({ isConnected: false, isInternetReachable: false, type: 'none' as never, details: null })).toEqual({ online: false, weak: false });
    expect(toNetwork({ isConnected: true, isInternetReachable: true, type: 'cellular' as never, details: { cellularGeneration: '2g' } as never })).toEqual({ online: true, weak: true });
    expect(toNetwork({ isConnected: true, isInternetReachable: true, type: 'wifi' as never, details: {} as never })).toEqual({ online: true, weak: false });
  });
  it('recognises fetch failures as network errors', () => {
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkError(new Error('arrival_cooldown'))).toBe(false);
  });
});

describe('X-04 pending list', () => {
  it('shows each state with retry and stale confirmation', async () => {
    const onRetry = jest.fn();
    const onConfirm = jest.fn();
    const base = { payload: {}, label: '', createdAt: Date.parse('2026-11-05T02:00:00Z'), attempts: 0, nextAttemptAt: 0 };
    await renderUi(
      <PendingList
        onRetry={onRetry}
        onConfirm={onConfirm}
        actions={[
          { ...base, clientId: '1', kind: 'publish_menu', status: 'queued' },
          { ...base, clientId: '2', kind: 'set_sold_out', status: 'sending' },
          { ...base, clientId: '3', kind: 'set_sold_out', status: 'sent' },
          { ...base, clientId: '4', kind: 'send_deal', status: 'failed' },
          { ...base, clientId: '5', kind: 'vendor_arrive', status: 'needs_confirm' },
        ]}
      />,
    );
    expect(screen.getByText('Menu publish')).toBeTruthy();
    for (const s of ['queued', 'sending', 'sent', 'failed', 'needs_confirm']) expect(screen.getByTestId(`pending-${s}`)).toBeTruthy();
    await fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledWith('4');
    expect(screen.getByText('This arrival is from 7:30 AM. Send it now? Buyers may have missed you.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('stale-send'));
    expect(onConfirm).toHaveBeenCalledWith('5', true);
  });
});

describe('V-08 offline arrival is queued', () => {
  it('shows the late warning and the queued state', async () => {
    const stop = { stopId: 's', gateId: 'g', gateName: 'Gate 1', societyName: 'Green Park', lat: 18.4895, lng: 73.8215, windowStart: '08:00', windowEnd: '08:45', followers: 42, skipped: false, arrivedAt: null, leftAt: null, leavingAt: null, lastArrivalAt: null, arrivalEventId: null };
    await renderUi(
      <ArriveSheet
        visible
        stops={[stop]}
        onClose={jest.fn()}
        deps={{ isOnline: () => false, locationAllowed: async () => true, getPosition: async () => ({ lat: 18.4896, lng: 73.8215 }), send: async () => ({ queued: true }), undo: jest.fn(), onDone: jest.fn(), openSettings: jest.fn() }}
      />,
    );
    await waitFor(() => expect(screen.getByText('Send when online')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('send-arrival'));
    await waitFor(() => expect(screen.getByTestId('arrival-queued')).toBeTruthy());
  });
});
