import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sabzi/shared';

export const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
// Local demo keys printed by `supabase status` (same for every local stack; not secrets).
export const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Signs in with a test phone from config.toml (OTP 123456) */
export async function phoneLogin(phone: string): Promise<SupabaseClient<Database>> {
  const c = anonClient();
  // Test numbers verify without a send; sending is rate-limited to once per 30 s per number.
  const first = await c.auth.verifyOtp({ phone, token: '123456', type: 'sms' });
  if (!first.error) return c;
  const sent = await c.auth.signInWithOtp({ phone });
  if (sent.error) throw sent.error;
  const { error } = await c.auth.verifyOtp({ phone, token: '123456', type: 'sms' });
  if (error) throw error;
  return c;
}

export async function emailPasswordLogin(email: string, password: string): Promise<SupabaseClient<Database>> {
  const c = anonClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}
