import { Redirect, Tabs, router, usePathname } from 'expo-router';
import { Linking, View } from 'react-native';
import { CalendarCheck, ClipboardList, MapPinned, User } from 'lucide-react-native';
import { SUPPORT_PHONE } from '@sabzi/shared';
import { useSession } from '../../src/features/auth/session';
import { TypeModeScope, useTheme } from '../../src/theme/ThemeProvider';
import { makeTabBar } from '../../src/ui/TabBar';
import { Screen, SkeletonBlock } from '../../src/ui';
import { ArriveFab } from '../../src/features/vendor/ArriveFab';
import { ArriveSheet } from '../../src/features/vendor/ArriveSheet';
import { VendorShellProvider, useVendorShell } from '../../src/features/vendor/VendorShell';
import { useInvalidateVendor, useMyVendor, useStopsToday, vendorKeys } from '../../src/features/vendor/hooks';
import { currentStop } from '../../src/features/vendor/arrival';
import { arrive, undoStopEvent } from '../../src/features/vendor/api';
import { currentPosition, locationPermission, openAppSettings, requestLocationPermission } from '../../src/lib/permissions';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { en } from '../../src/i18n/en';

const TabBar = makeTabBar([
  { key: 'today', label: en.nav.vendorTabs.today, icon: CalendarCheck },
  { key: 'stops', label: en.nav.vendorTabs.stops, icon: MapPinned },
  { key: 'requests', label: en.nav.vendorTabs.requests, icon: ClipboardList },
  { key: 'me', label: en.nav.vendorTabs.me, icon: User },
]);

function ArriveLayer() {
  const path = usePathname();
  const t = useTheme();
  const { arriveOpen, openArrive, closeArrive } = useVendorShell();
  const vendor = useMyVendor();
  const stops = useStopsToday();
  const invalidate = useInvalidateVendor();
  const verified = vendor.data?.status === 'verified';
  const live = currentStop(stops.data ?? []);
  const showFab = /\/(today|stops)$/.test(path) && !live;
  return (
    <>
      {showFab ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: t.layout.bottomNav }}>
          <ArriveFab onPress={openArrive} disabled={!verified} />
        </View>
      ) : null}
      <ArriveSheet
        visible={arriveOpen}
        stops={stops.data ?? []}
        onClose={closeArrive}
        deps={{
          locationAllowed: async () => (await locationPermission()) === 'granted' || (await requestLocationPermission()) === 'granted',
          getPosition: () => currentPosition(),
          send: (s, pos) => arrive(s.gateId, pos),
          undo: (id) => undoStopEvent(id),
          openSettings: openAppSettings,
          onDone: () => {
            closeArrive();
            invalidate(vendorKeys.stops, vendorKeys.stats);
            router.push('/vendor/live');
          },
        }}
      />
    </>
  );
}

export default function VendorLayout() {
  const { status, step } = useSession();
  const vendor = useMyVendor();
  if (status === 'signedOut') return <Redirect href="/(auth)/welcome" />;
  if (status === 'signedIn' && step !== 'vendor') return <Redirect href="/" />;
  if (vendor.isLoading) return <Screen><SkeletonBlock kind="vendorCard" count={3} /></Screen>;
  if (vendor.isSuccess && !vendor.data) return <Redirect href="/vendor-setup/details" />;
  if (vendor.data?.status === 'suspended') {
    return (
      <SystemScreen illustration="lock" title={en.vendor.suspendedTitle} actionLabel={en.common.callSupport} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="x15" />
    );
  }
  if (vendor.data?.status === 'verified' && !vendor.data.verified_seen_at) return <Redirect href="/vendor-setup/status" />;
  return (
    <TypeModeScope mode="vendor">
      <VendorShellProvider>
        <View style={{ flex: 1 }}>
          <Tabs tabBar={TabBar} screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="today" />
            <Tabs.Screen name="stops" />
            <Tabs.Screen name="requests" />
            <Tabs.Screen name="me" />
          </Tabs>
          <ArriveLayer />
        </View>
      </VendorShellProvider>
    </TypeModeScope>
  );
}
