import { formatIstTime } from '@sabzi/shared';
import { Banner } from '../../ui';
import { useOffline } from '../../lib/offline/OfflineProvider';
import { en } from '../../i18n/en';

/** X-02 (offline with cached data) and X-03 (weak network). */
export function NetworkBanner({ dataUpdatedAt }: { dataUpdatedAt?: number }) {
  const { online, weak } = useOffline();
  if (!online) {
    return <Banner kind="offline" testID="x02" message={dataUpdatedAt ? en.system.offlineBanner(formatIstTime(new Date(dataUpdatedAt))) : en.system.offlineBannerNoTime} />;
  }
  if (weak) return <Banner kind="weak" testID="x03" message={en.system.weak} />;
  return null;
}
