import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Share, View } from 'react-native';
import { ArrowLeft, EllipsisVertical, Flag, Share2 } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, IconCircleButton, ListRow, Icon, Screen, Snackbar } from '../../../src/ui';
import { VendorPageView } from '../../../src/features/buyer/VendorPageView';
import { FollowSheet } from '../../../src/features/buyer/FollowSheet';
import { useBuyerHome, useMySocieties, usePrimarySociety, useVendorPage } from '../../../src/features/buyer/hooks';
import { follow, recordView, unfollow, vendorPhone } from '../../../src/features/buyer/api';
import { notificationPermission, openAppSettings } from '../../../src/lib/permissions';
import { vendorQrUrl } from '../../../src/ui/QrCard';
import { track } from '../../../src/lib/analytics';
import { en } from '../../../src/i18n/en';
import { NetworkBanner } from '../../../src/features/system/NetworkBanner';

const COACH_KEY = 'sabzi.coach.follow';

/** B-05 vendor page + B-07 follow sheet. */
export default function VendorPageScreen() {
  const { id, society: societyParam } = useLocalSearchParams<{ id: string; society?: string }>();
  const { primary } = usePrimarySociety();
  const mine = useMySocieties();
  const societyId = societyParam ?? primary?.id ?? null;
  const page = useVendorPage(id, societyId);
  const home = useBuyerHome(societyId);
  const qc = useQueryClient();
  const [sheet, setSheet] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [coach, setCoach] = useState(false);
  const [menu, setMenu] = useState(false);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(buyer)/home'));

  useEffect(() => {
    recordView(id).catch(() => undefined);
    track('vendor_page_viewed');
    AsyncStorage.getItem(COACH_KEY).then((v) => setCoach(!v)).catch(() => undefined);
  }, [id]);

  const data = page.data;
  const name = data && data.available ? data.vendor.display_name : '';
  const served = data && data.available ? [...new Set(data.stops.map((s) => s.society_id))] : [];
  const following = data && data.available ? data.following : [];
  const alternatives = (home.data ?? []).filter((v) => v.vendor_id !== id && v.status !== 'not_coming' && v.status !== 'left');

  return (
    <Screen
      padded={false}
      footer={data?.available ? <Button label={en.buyer.requestTomorrow} onPress={() => router.push({ pathname: '/buyer/request', params: { vendorId: id, name } })} testID="request-tomorrow" /> : undefined}
      refreshing={page.isRefetching}
      onRefresh={() => page.refetch()}
    >
      <NetworkBanner dataUpdatedAt={page.dataUpdatedAt || undefined} />
      <VendorPageView
        topBar={
          <>
            <IconCircleButton icon={ArrowLeft} label={en.nav.back} onPress={goBack} testID="app-bar-back" />
            {data?.available ? <IconCircleButton icon={EllipsisVertical} label={en.buyer.moreOptions} onPress={() => setMenu((m) => !m)} testID="overflow" /> : null}
          </>
        }
        page={data}
        loading={page.isLoading}
        societyName={mine.data?.find((s) => s.id === societyId)?.name}
        alternatives={alternatives}
        coach={coach}
        onCoachDone={() => {
          setCoach(false);
          AsyncStorage.setItem(COACH_KEY, '1').catch(() => undefined);
        }}
        actions={{
          follow: async () => {
            setBlocked((await notificationPermission().catch(() => 'undetermined')) === 'denied');
            setSheet(true);
          },
          call: async () => {
            const phone = await vendorPhone(id);
            if (phone) Linking.openURL(`tel:${phone}`);
          },
          openPhoto: () => data?.available && router.push({ pathname: '/buyer/photo', params: { path: data.menu?.stock_photo_path ?? '', at: data.menu?.stock_photo_at ?? '', name } }),
          seeAllReviews: () => router.push({ pathname: '/buyer/reviews', params: { vendorId: id, name } }),
          writeReview: () => router.push({ pathname: '/buyer/review', params: { vendorId: id, name } }),
          requestTomorrow: () => router.push({ pathname: '/buyer/request', params: { vendorId: id, name } }),
          goHome: () => router.replace('/(buyer)/home'),
          openVendor: (vid) => router.push({ pathname: '/buyer/vendor/[id]', params: { id: vid } }),
        }}
      />
      {menu && data?.available ? (
        <Card style={{ position: 'absolute', top: 52, right: 16, padding: 0, paddingHorizontal: 16, minWidth: 200 }} testID="overflow-menu">
          <ListRow
            title={en.buyer.report}
            left={<Icon icon={Flag} size={18} />}
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/buyer/report', params: { vendorId: id, name } });
            }}
          />
          <ListRow
            title={en.buyer.share}
            last
            left={<Icon icon={Share2} size={18} />}
            onPress={() => {
              setMenu(false);
              Share.share({ message: en.vendor.shareText(name, vendorQrUrl(data.vendor.code)) });
            }}
          />
        </Card>
      ) : null}
      {toast ? <Snackbar kind="success" message={toast} /> : null}
      <View />
      {data?.available ? (
        <FollowSheet
          visible={sheet}
          vendorName={name}
          societies={mine.data ?? []}
          servedSocietyIds={served}
          defaultSociety={societyId}
          initialPrefs={following[0]}
          following={following.length > 0}
          notificationsBlocked={blocked}
          onTurnOn={openAppSettings}
          onClose={() => setSheet(false)}
          onFollow={async (soc, prefs) => {
            await follow(id, soc, prefs);
            track('vendor_followed');
            setSheet(false);
            setToast(en.buyer.followedSnack(name.split(' ')[0]!));
            await qc.invalidateQueries({ queryKey: ['buyer'] });
          }}
          onUnfollow={async () => {
            await unfollow(id, null);
            track('vendor_unfollowed');
            setSheet(false);
            setToast(en.buyer.unfollowedSnack(name.split(' ')[0]!));
            await qc.invalidateQueries({ queryKey: ['buyer'] });
          }}
        />
      ) : null}
    </Screen>
  );
}
