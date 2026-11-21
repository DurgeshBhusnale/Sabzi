import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { InAppBanner, type InAppMessage } from './InAppBanner';
import { registerForPush } from './push';
import { markOpened } from '../buyer/api';
import { notificationPermission } from '../../lib/permissions';
import { track } from '../../lib/analytics';
import { useSession } from '../auth/session';
import { targetOf, tapDecision, type Data } from './notificationTap';
import { setPendingRoute } from '../../lib/pendingRoute';

// Foreground: we show our own banner instead of the system alert (§9.2).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // eslint-disable-next-line import/namespace -- enum exists at runtime and in types
  await Notifications.setNotificationChannelAsync('arrivals', { name: 'Vendor arrivals', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  // Android never lets an app raise a channel's importance after creation, so the old DEFAULT 'updates'
  // channel is replaced by a new HIGH 'alerts' channel (heads-up even when the app is closed).
  // eslint-disable-next-line import/namespace
  await Notifications.setNotificationChannelAsync('alerts', { name: 'Request replies and deals', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  await Notifications.deleteNotificationChannelAsync('updates').catch(() => undefined);
}


export function openFromData(data: Data): void {
  if (data.notification_id) {
    markOpened(data.notification_id).catch(() => undefined);
    track('alert_opened', { type: data.type ?? null });
  }
  router.push(targetOf(data) as never);
}

/** Registers the push token after login, handles taps (NOT-4 metric) and foreground banners. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status, account } = useSession();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<InAppMessage | null>(null);
  const dismiss = useCallback(() => setBanner(null), []);
  // TECH-09: covers the tap that cold-started the app as well as later taps; routes once the navigator is mounted.
  const lastResponse = Notifications.useLastNotificationResponse();
  const navReady = !!useRootNavigationState()?.key;
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!lastResponse || !navReady) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;
    const data = (lastResponse.notification.request.content.data ?? {}) as Data;
    const d = tapDecision(data, { status, role: account?.role });
    if (d.kind === 'wait') return;
    handled.current = id;
    if (d.kind === 'go') openFromData(data);
    else if (d.kind === 'pending') setPendingRoute(d.href);
  }, [lastResponse, navReady, status, account?.role]);

  useEffect(() => {
    ensureAndroidChannels().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (status !== 'signedIn' || !account?.role) return;
    notificationPermission()
      .then((p) => (p === 'granted' ? registerForPush() : null))
      .catch(() => undefined);
  }, [status, account?.role]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((n) => {
      const data = (n.request.content.data ?? {}) as Data;
      qc.invalidateQueries({ queryKey: ['buyer'] });
      qc.invalidateQueries({ queryKey: ['vendor'] });
      setBanner({
        id: n.request.identifier,
        title: n.request.content.title ?? '',
        body: n.request.content.body ?? '',
        vendorName: n.request.content.title?.split(' ')[0],
        onView: () => openFromData(data),
      });
    });
    return () => {
      received.remove();
    };
  }, [qc]);

  return (
    <>
      {children}
      <InAppBanner message={banner} onDismiss={dismiss} />
    </>
  );
}
