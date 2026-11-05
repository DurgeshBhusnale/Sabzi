import { getSupabase } from './supabase';

export function publicUrl(bucket: 'vendor-photos' | 'stock-photos' | 'item-images', path: string | null | undefined): string | null {
  if (!path) return null;
  return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Uploads a local file URI (from the camera/picker) as JPEG. */
export async function uploadImage(bucket: string, path: string, uri: string): Promise<void> {
  const res = await fetch(uri);
  const body = await res.arrayBuffer();
  const { error } = await getSupabase().storage.from(bucket).upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
}
