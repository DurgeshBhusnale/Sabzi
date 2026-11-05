import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { makeQueryClient } from '../src/lib/queryClient';
import { fontAssets } from '../src/theme/fonts';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { Splash } from '../src/features/system/Splash';
import { NotificationsProvider } from '../src/features/notifications/NotificationsProvider';
import { OfflineProvider } from '../src/lib/offline/OfflineProvider';
import { AppStatusGate } from '../src/features/system/AppStatusGate';
import { PERSIST_MAX_AGE, queryPersister } from '../src/lib/persist';
import { setAnalyticsSink, track } from '../src/lib/analytics';
import { createPosthogSink } from '../src/lib/posthog';
import { getSupabase } from '../src/lib/supabase';
import { SessionProvider, useSession } from '../src/features/auth/session';
import { AppState } from 'react-native';

const posthog = createPosthogSink({ key: process.env.EXPO_PUBLIC_POSTHOG_KEY, host: process.env.EXPO_PUBLIC_POSTHOG_HOST });
if (posthog) setAnalyticsSink(posthog.sink);

/** app_opened on every start/foreground; server-side daily open row for the week-4 retention metric. */
function AppOpenTracker() {
  const { status, account } = useSession();
  useEffect(() => {
    const opened = () => {
      track('app_opened', { role: account?.role ?? null });
      if (status === 'signedIn') getSupabase().rpc('record_app_open').then(() => undefined, () => undefined);
    };
    opened();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') opened();
      if (st === 'background') posthog?.flush();
    });
    return () => sub.remove();
  }, [status, account?.role]);
  return null;
}

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
                  <AppOpenTracker />
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
