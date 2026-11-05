'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@sabzi/shared/db.types';

let client: SupabaseClient<Database> | null = null;

/** Browser client with the public anon key; rights come from the signed-in admin's JWT + RLS. */
export function sb(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: true, autoRefreshToken: true } },
    );
  }
  return client;
}

export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (sb().rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
