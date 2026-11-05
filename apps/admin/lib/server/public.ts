import { createClient } from '@supabase/supabase-js';

/** Server-side anon client for the public QR pages (only `public_*` functions are readable without login). */
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false },
  });
}

export function storageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'}/storage/v1/object/public/${bucket}/${path}`;
}
