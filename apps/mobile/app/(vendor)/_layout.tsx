import { Redirect, Tabs, usePathname } from 'expo-router';
import { View } from 'react-native';
import { CalendarCheck, ClipboardList, MapPinned, User } from 'lucide-react-native';
import { useSession } from '../../src/features/auth/session';
import { TypeModeScope, useTheme } from '../../src/theme/ThemeProvider';
import { makeTabBar } from '../../src/ui/TabBar';
import { ArriveFab } from '../../src/features/vendor/ArriveFab';
import { VendorShellProvider, useVendorShell } from '../../src/features/vendor/VendorShell';
import { en } from '../../src/i18n/en';

const TabBar = makeTabBar([
  { key: 'today', label: en.nav.vendorTabs.today, icon: CalendarCheck },
  { key: 'stops', label: en.nav.vendorTabs.stops, icon: MapPinned },
  { key: 'requests', label: en.nav.vendorTabs.requests, icon: ClipboardList },
  { key: 'me', label: en.nav.vendorTabs.me, icon: User },
]);

function FabOnTodayAndStops() {
  const path = usePathname();
  const t = useTheme();
  const { openArrive } = useVendorShell();
  if (!/\/(today|stops)$/.test(path)) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: t.layout.bottomNav }}>
      <ArriveFab onPress={openArrive} />
    </View>
  );
}

export default function VendorLayout() {
  const { status, step } = useSession();
  if (status === 'signedOut') return <Redirect href="/(auth)/welcome" />;
  if (status === 'signedIn' && step !== 'vendor') return <Redirect href="/" />;
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
          <FabOnTodayAndStops />
        </View>
      </VendorShellProvider>
    </TypeModeScope>
  );
}
