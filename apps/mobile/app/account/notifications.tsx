import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banner, Card, Screen, SkeletonBlock, Toggle, TopAppBar } from '../../src/ui';
import { getNotifyPrefs, setNotifyPref, type NotifyPrefs } from '../../src/features/account/api';
import { notificationPermission, openAppSettings } from '../../src/lib/permissions';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-13: global toggles; banner with "Open settings" when blocked at the system level. */
export default function NotificationSettings() {
  const { account } = useSession();
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: ['notify-prefs'], queryFn: () => getNotifyPrefs() });
  const perm = useQuery({ queryKey: ['perm', 'notifications'], queryFn: notificationPermission });
  const set = async (k: keyof NotifyPrefs, v: boolean) => {
    qc.setQueryData(['notify-prefs'], { ...prefs.data!, [k]: v });
    try {
      qc.setQueryData(['notify-prefs'], await setNotifyPref(k, v));
    } catch {
      qc.invalidateQueries({ queryKey: ['notify-prefs'] });
    }
  };
  const vendor = account?.role === 'vendor';
  const rows: { key: keyof NotifyPrefs; label: string }[] = vendor
    ? [
        { key: 'vendor_requests', label: en.settings.vendorRequests },
        { key: 'vendor_ratings', label: en.settings.vendorRatings },
      ]
    : [
        { key: 'arrival', label: en.settings.buyerArrival },
        { key: 'deals', label: en.settings.buyerDeals },
        { key: 'replies', label: en.settings.buyerReplies },
      ];
  return (
    <Screen header={<TopAppBar title={en.settings.notifTitle} onBack={() => router.back()} />}>
      {perm.data === 'denied' ? <Banner kind="error" message={vendor ? en.permissions.notifBlockedVendor : en.permissions.notifBlockedBuyer} actionLabel={en.common.openSettings} onAction={openAppSettings} /> : null}
      {prefs.isLoading ? (
        <SkeletonBlock kind="list" count={3} />
      ) : (
        <Card>
          {rows.map((r) => (
            <Toggle key={r.key} label={r.label} value={!!prefs.data?.[r.key]} onChange={(v) => set(r.key, v)} testID={`pref-${r.key}`} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
