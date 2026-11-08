import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sabzi/shared';

export type Client = SupabaseClient<Database>;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://10.0.2.2:54321';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: Client | null = null;

/** AUTH-5: session persisted on the device and refreshed silently. */
export function getSupabase(): Client {
  if (!client) {
    client = createClient<Database>(url, anonKey, {
      auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    });
  }
  return client;
}

/** Tests replace the client with a fake. */
export function setSupabaseForTests(fake: Client | null): void {
  client = fake;
}
