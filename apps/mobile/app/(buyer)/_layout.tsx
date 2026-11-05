import { Redirect, Tabs } from 'expo-router';
import { ClipboardList, Heart, House, User } from 'lucide-react-native';
import { useSession } from '../../src/features/auth/session';
import { TypeModeScope } from '../../src/theme/ThemeProvider';
import { makeTabBar } from '../../src/ui/TabBar';
import { en } from '../../src/i18n/en';

const TabBar = makeTabBar([
  { key: 'home', label: en.nav.buyerTabs.home, icon: House },
  { key: 'following', label: en.nav.buyerTabs.following, icon: Heart },
  { key: 'requests', label: en.nav.buyerTabs.requests, icon: ClipboardList },
  { key: 'profile', label: en.nav.buyerTabs.profile, icon: User },
]);

export default function BuyerLayout() {
  const { status, step } = useSession();
  if (status === 'signedOut') return <Redirect href="/(auth)/welcome" />;
  if (status === 'signedIn' && step !== 'buyer') return <Redirect href="/" />;
  return (
    <TypeModeScope mode="buyer">
      <Tabs tabBar={TabBar} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="following" />
        <Tabs.Screen name="requests" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </TypeModeScope>
  );
}
