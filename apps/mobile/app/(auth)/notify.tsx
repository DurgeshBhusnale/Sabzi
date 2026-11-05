import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PermissionRationale } from '../../src/features/system/PermissionRationale';
import { requestNotificationPermission } from '../../src/lib/permissions';
import { registerForPush } from '../../src/features/notifications/push';
import { en } from '../../src/i18n/en';

/** S-08 */
export default function NotifyRationale() {
  const { role = 'buyer' } = useLocalSearchParams<{ role: string }>();
  const [busy, setBusy] = useState(false);
  const next = () => router.replace({ pathname: '/(auth)/location', params: { role } });
  return (
    <PermissionRationale
      kind="notifications"
      title={role === 'vendor' ? en.permissions.notifTitleVendor : en.permissions.notifTitleBuyer}
      body={en.permissions.notifBody}
      busy={busy}
      onAllow={async () => {
        setBusy(true);
        const s = await requestNotificationPermission().catch(() => 'denied' as const);
        if (s === 'granted') await registerForPush().catch(() => undefined);
        setBusy(false);
        next();
      }}
      onSkip={next}
    />
  );
}
