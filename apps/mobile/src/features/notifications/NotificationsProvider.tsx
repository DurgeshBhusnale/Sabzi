import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { InAppBanner, type InAppMessage } from './InAppBanner';
import { registerForPush } from './push';
import { markOpened, type NotificationRow } from '../buyer/api';
import { notificationTarget } from '../buyer/notificationCopy';
import { notificationPermission } from '../../lib/permissions';
import { track } from '../../lib/analytics';
import { useSession } from '../auth/session';

// Foreground: we show our own banner instead of the system alert (§9.2).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // eslint-disable-next-line import/namespace -- enum exists at runtime and in types
  await Notifications.setNotificationChannelAsync('arrivals', { name: 'Vendor arrivals', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  // eslint-disable-next-line import/namespace
  await Notifications.setNotificationChannelAsync('updates', { name: 'Deals and replies', importance: Notifications.AndroidImportance.DEFAULT });
}

type Data = Record<string, string | undefined>;

export function openFromData(data: Data): void {
  if (data.notification_id) {
    markOpened(data.notification_id).catch(() => undefined);
    track('alert_opened', { type: data.type ?? null });
  }
  const row = { id: data.notification_id ?? '', type: data.type ?? '', payload: data, sent_at: '', opened_at: null } as NotificationRow;
  router.push(notificationTarget(row) as never);
}

/** Registers the push token after login, handles taps (NOT-4 metric) and foreground banners. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status, account } = useSession();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<InAppMessage | null>(null);
  const dismiss = useCallback(() => setBanner(null), []);

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
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => openFromData((r.notification.request.content.data ?? {}) as Data));
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [qc]);

  return (
    <>
      {children}
      <InAppBanner message={banner} onDismiss={dismiss} />
    </>
  );
}
