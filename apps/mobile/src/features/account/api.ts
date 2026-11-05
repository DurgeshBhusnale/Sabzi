import { getSupabase, type Client } from '../../lib/supabase';
import { raise } from '../../lib/errors';

export type NotifyPrefs = { arrival: boolean; deals: boolean; replies: boolean; vendor_requests: boolean; vendor_ratings: boolean };

export async function getNotifyPrefs(c: Client = getSupabase()): Promise<NotifyPrefs> {
  const { data, error } = await c.from('profiles').select('notify_prefs').single();
  if (error) raise(error);
  return data.notify_prefs as unknown as NotifyPrefs;
}

export async function setNotifyPref(key: keyof NotifyPrefs, value: boolean, c: Client = getSupabase()): Promise<NotifyPrefs> {
  const { data, error } = await c.rpc('set_notify_pref', { p_key: key, p_value: value });
  if (error) raise(error);
  return data as unknown as NotifyPrefs;
}
