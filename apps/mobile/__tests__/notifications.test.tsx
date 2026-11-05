import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderUi } from '../src/test/render';
import { InAppBanner } from '../src/features/notifications/InAppBanner';
import { NotificationsBlockedBanner } from '../src/features/notifications/BlockedBanner';
import { notificationTarget } from '../src/features/buyer/notificationCopy';

describe('§9.2 in-app banner', () => {
  it('shows the alert and auto-hides after 5 seconds', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const onView = jest.fn();
    await renderUi(<InAppBanner message={{ id: '1', title: 'Ramesh is at Gate 1 now', body: 'Tomato ₹40/kg · Onion ₹30/kg', vendorName: 'Ramesh', onView }} onDismiss={onDismiss} />);
    expect(screen.getByText('Ramesh is at Gate 1 now')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(onDismiss).toHaveBeenCalled();
    jest.useRealTimers();
  });
  it('View opens the vendor', async () => {
    const onView = jest.fn();
    await renderUi(<InAppBanner message={{ id: '1', title: 'Ramesh is at Gate 1 now', body: '', onView }} onDismiss={jest.fn()} />);
    await fireEvent.press(screen.getByText('View'));
    expect(onView).toHaveBeenCalled();
  });
});

describe('X-08 notifications blocked', () => {
  const wrap = (ui: React.ReactElement) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}>{ui}</QueryClientProvider>;
  it('buyer copy when denied', async () => {
    await renderUi(wrap(<NotificationsBlockedBanner role="buyer" check={async () => 'denied'} />));
    await waitFor(() => expect(screen.getByText("You won't know when vendors arrive.")).toBeTruthy());
    expect(screen.getByText('Open settings')).toBeTruthy();
  });
  it('vendor copy when denied', async () => {
    await renderUi(wrap(<NotificationsBlockedBanner role="vendor" check={async () => 'denied'} />));
    await waitFor(() => expect(screen.getByText("You won't hear about requests.")).toBeTruthy());
  });
  it('hidden when granted', async () => {
    await renderUi(wrap(<NotificationsBlockedBanner role="buyer" check={async () => 'granted'} />));
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByTestId('x08')).toBeNull();
  });
});

describe('tapping a notification opens the right screen', () => {
  const n = (type: string, payload: Record<string, string> = {}) => ({ id: 'n', type, payload, sent_at: '', opened_at: null });
  it('arrival → vendor page at that society', () => {
    expect(notificationTarget(n('arrival', { vendor_id: 'v', society_id: 's' }))).toEqual({ pathname: '/buyer/vendor/[id]', params: { id: 'v', society: 's' } });
  });
  it('deal → deals sheet, reply → requests, vendor kinds → vendor screens', () => {
    expect(notificationTarget(n('deal')).pathname).toBe('/buyer/deals');
    expect(notificationTarget(n('request_reply')).pathname).toBe('/(buyer)/requests');
    expect(notificationTarget(n('vendor_new_requests')).pathname).toBe('/(vendor)/requests');
    expect(notificationTarget(n('vendor_new_rating')).pathname).toBe('/vendor/reviews');
  });
});
