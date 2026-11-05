import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SessionProvider } from '../src/features/auth/session';
import { makeQueryClient } from '../src/lib/queryClient';
import { fontAssets } from '../src/theme/fonts';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { Splash } from '../src/features/system/Splash';
import { NotificationsProvider } from '../src/features/notifications/NotificationsProvider';
import { OfflineProvider } from '../src/lib/offline/OfflineProvider';
import { AppStatusGate } from '../src/features/system/AppStatusGate';
import { PERSIST_MAX_AGE, queryPersister } from '../src/lib/persist';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const t = useTheme();
  const [loaded] = useFonts(fontAssets);
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  if (!loaded) return <Splash />;
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}>
          <AppStatusGate>
            <SessionProvider>
              <OfflineProvider>
                <NotificationsProvider>
                  <Root />
                </NotificationsProvider>
              </OfflineProvider>
            </SessionProvider>
          </AppStatusGate>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
