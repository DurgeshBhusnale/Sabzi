import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PLAY_STORE_URL } from '@sabzi/shared';
import { getSupabase } from '../../lib/supabase';
import { appStatus } from '../../lib/version';
import { Banner } from '../../ui';
import { X11ForceUpdate, X13Maintenance } from './SystemStates';
import { en } from '../../i18n/en';

async function loadSettings(): Promise<Record<string, unknown>> {
  const { data } = await getSupabase().from('app_settings').select('key, value');
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

/** Force update (X-11), optional update banner (X-12) and maintenance (X-13), driven by app_settings. */
export function AppStatusGate({ children, version = Constants.expoConfig?.version ?? '0.0.0', load = loadSettings }: { children: ReactNode; version?: string; load?: () => Promise<Record<string, unknown>> }) {
  const q = useQuery({ queryKey: ['app-settings'], queryFn: load, staleTime: 15 * 60_000, retry: 0 });
  const [dismissed, setDismissed] = useState(false);
  const status = q.data ? appStatus(version, q.data) : { kind: 'ok' as const };
  if (status.kind === 'force_update') return <X11ForceUpdate />;
  if (status.kind === 'maintenance') return <X13Maintenance until={status.until} />;
  return (
    <View style={{ flex: 1 }}>
      {status.kind === 'optional_update' && !dismissed ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 88, zIndex: 50 }}>
          <Banner kind="info" testID="x12" message={en.system.optionalUpdate} actionLabel={en.system.update} onAction={() => { setDismissed(true); Linking.openURL(PLAY_STORE_URL); }} />
        </View>
      ) : null}
      {children}
    </View>
  );
}
