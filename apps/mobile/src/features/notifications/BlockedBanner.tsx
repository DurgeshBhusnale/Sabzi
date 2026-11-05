import { useQuery } from '@tanstack/react-query';
import { Banner } from '../../ui';
import { notificationPermission, openAppSettings } from '../../lib/permissions';
import { en } from '../../i18n/en';

/** X-08: notifications blocked at the system level. */
export function NotificationsBlockedBanner({ role, check = notificationPermission }: { role: 'buyer' | 'vendor'; check?: () => Promise<string> }) {
  const perm = useQuery({ queryKey: ['perm', 'notifications'], queryFn: check, staleTime: 60_000 });
  if (perm.data !== 'denied') return null;
  return (
    <Banner
      kind="error"
      testID="x08"
      message={role === 'vendor' ? en.permissions.notifBlockedVendor : en.permissions.notifBlockedBuyer}
      actionLabel={en.common.openSettings}
      onAction={openAppSettings}
    />
  );
}
