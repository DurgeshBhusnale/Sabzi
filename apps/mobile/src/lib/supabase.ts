import { AppState, Platform } from 'react-native';
import { createSecureStorage } from './secureStorage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sabzi/shared';

export type Client = SupabaseClient<Database>;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://10.0.2.2:54321';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: Client | null = null;

/**
 * TECH-03: a release build (APK or OTA bundle) made without the EAS environment has no Supabase URL/key and
 * would silently talk to the emulator address and hang. Returns why the build is unusable, or null.
 */
export function configProblem(u: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL, k: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, dev: boolean = __DEV__): 'missing' | 'local' | null {
  if (dev) return null;
  if (!u || !k) return 'missing';
  if (/10\.0\.2\.2|127\.0\.0\.1|localhost/.test(u)) return 'local';
  return null;
}

/** AUTH-5: session persisted on the device and refreshed silently. */
export function getSupabase(): Client {
  if (!client) {
    client = createClient<Database>(url, anonKey, {
      auth: { storage: createSecureStorage(), persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    });
    // TECH-10: refresh the token only while the app is in the foreground, and right away when it comes back.
    if (Platform.OS !== 'web') {
      const c = client;
      AppState.addEventListener('change', (s) => {
        if (s === 'active') c.auth.startAutoRefresh();
        else c.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}

/** Tests replace the client with a fake. */
export function setSupabaseForTests(fake: Client | null): void {
  client = fake;
}
