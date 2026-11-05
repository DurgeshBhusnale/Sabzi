import { Redirect, Tabs } from 'expo-router';
import { ClipboardList, Heart, House, User } from 'lucide-react-native';
import { useSession } from '../../src/features/auth/session';
import { TypeModeScope } from '../../src/theme/ThemeProvider';
import { makeTabBar } from '../../src/ui/TabBar';
import { Screen, SkeletonBlock } from '../../src/ui';
import { usePrimarySociety, useLiveStopEvents } from '../../src/features/buyer/hooks';
import { BuyerProvider } from '../../src/features/buyer/BuyerContext';
import { en } from '../../src/i18n/en';

const TabBar = makeTabBar([
  { key: 'home', label: en.nav.buyerTabs.home, icon: House },
  { key: 'following', label: en.nav.buyerTabs.following, icon: Heart },
  { key: 'requests', label: en.nav.buyerTabs.requests, icon: ClipboardList },
  { key: 'profile', label: en.nav.buyerTabs.profile, icon: User },
]);

export default function BuyerLayout() {
  const { status, step } = useSession();
  const societies = usePrimarySociety();
  useLiveStopEvents(status === 'signedIn' && step === 'buyer');
  if (status === 'signedOut') return <Redirect href="/(auth)/welcome" />;
  if (status === 'signedIn' && step !== 'buyer') return <Redirect href="/" />;
  if (societies.isLoading) return <Screen><SkeletonBlock kind="vendorCard" count={3} /></Screen>;
  if (societies.isSuccess && !societies.primary) return <Redirect href="/buyer-setup/society" />;
  return (
    <TypeModeScope mode="buyer">
      <BuyerProvider initial={societies.primary?.id ?? null}>
        <Tabs tabBar={TabBar} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="following" />
          <Tabs.Screen name="requests" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </BuyerProvider>
    </TypeModeScope>
  );
}
