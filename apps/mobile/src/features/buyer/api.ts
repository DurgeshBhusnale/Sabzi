import { getSupabase, type Client } from '../../lib/supabase';
import { raise } from '../../lib/errors';
import type { HomeVendor, MenuJson, SavedSociety, Society } from './types';

export async function listSocieties(c: Client = getSupabase()): Promise<Society[]> {
  const { data, error } = await c.from('societies').select('id, name, area, address, lat, lng, flats_count').eq('active', true).order('name');
  if (error) raise(error);
  return (data ?? []) as Society[];
}

export async function mySocieties(c: Client = getSupabase()): Promise<SavedSociety[]> {
  const { data, error } = await c.from('buyer_societies').select('is_primary, created_at, societies(id, name, area, address, lat, lng, flats_count)').order('created_at');
  if (error) raise(error);
  return (data ?? []).map((r) => ({ ...(r.societies as unknown as Society), is_primary: r.is_primary }));
}

export async function saveSociety(id: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('save_society', { p_society_id: id });
  if (error) raise(error);
}

export async function removeSociety(id: string, c: Client = getSupabase()) {
  const { error } = await c.from('buyer_societies').delete().eq('society_id', id);
  if (error) raise(error);
}

export async function setPrimarySociety(id: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('set_primary_society', { p_society_id: id });
  if (error) raise(error);
}

export async function societyServed(id: string, c: Client = getSupabase()): Promise<boolean> {
  const { data, error } = await c.rpc('society_served', { p_society_id: id });
  if (error) raise(error);
  return !!data;
}

export async function joinWaitlist(societyName: string, societyId: string | null, vendorHint?: string, c: Client = getSupabase()) {
  const { data: u } = await c.auth.getUser();
  const { error } = await c.from('waitlist').insert({ user_id: u.user!.id, society_name: societyName, society_id: societyId, vendor_hint: vendorHint ?? null });
  if (error) raise(error);
}

export async function buyerHome(societyId: string, c: Client = getSupabase()): Promise<HomeVendor[]> {
  const { data, error } = await c.rpc('buyer_home', { p_society_id: societyId });
  if (error) raise(error);
  return (data ?? []) as unknown as HomeVendor[];
}

export type PublicVendor = {
  id: string; display_name: string; photo_path: string | null; vehicle: 'tempo' | 'thela'; delivery_available: boolean; allow_calls: boolean;
  code: string; avg_rating: number; rating_count: number; tag_counts: Record<string, number>;
  stars_5: number; stars_4: number; stars_3: number; stars_2: number; stars_1: number;
};
export type VendorStop = { stop_id: string; society_id: string; society_name: string; gate_id: string; gate_name: string; days_of_week: number[]; window_start: string; window_end: string; skipped_today: boolean };
export type PublicReview = { id: string; reviewer_name: string; society_name: string | null; stars: number; tags: string[]; text: string | null; vendor_reply: string | null; created_at: string; is_mine: boolean; status: 'visible' | 'hidden'; hidden_reason: string | null };
export type FollowRow = { society_id: string; notify_arrival: boolean; notify_deals: boolean; notify_requests: boolean };
export type VendorPage =
  | { available: false }
  | {
      available: true;
      vendor: PublicVendor;
      today: { status: HomeVendor['status']; status_at: string | null; gate_name: string; window_start: string; window_end: string } | null;
      menu: MenuJson;
      stops: VendorStop[];
      reviews: PublicReview[];
      following: FollowRow[];
    };

export async function vendorPage(vendorId: string, societyId: string | null, c: Client = getSupabase()): Promise<VendorPage> {
  const { data, error } = await c.rpc('vendor_page', { p_vendor_id: vendorId, p_society_id: societyId ?? undefined });
  if (error) raise(error);
  return data as unknown as VendorPage;
}

export async function recordView(vendorId: string, c: Client = getSupabase()) {
  await c.rpc('record_vendor_view', { p_vendor_id: vendorId });
}

export async function vendorPhone(vendorId: string, c: Client = getSupabase()): Promise<string | null> {
  const { data } = await c.rpc('get_vendor_phone', { p_vendor_id: vendorId });
  return (data as string | null) ?? null;
}

export async function vendorByCode(code: string, c: Client = getSupabase()): Promise<string | null> {
  const { data, error } = await c.rpc('vendor_by_code', { p_code: code });
  if (error) raise(error);
  return (data as string | null) ?? null;
}

export type FollowPrefs = { notify_arrival: boolean; notify_deals: boolean; notify_requests: boolean };
export async function follow(vendorId: string, societyId: string, prefs: FollowPrefs, c: Client = getSupabase()) {
  const { error } = await c.rpc('follow_vendor', { p_vendor_id: vendorId, p_society_id: societyId, p_prefs: prefs });
  if (error) raise(error);
}

export async function unfollow(vendorId: string, societyId: string | null, c: Client = getSupabase()) {
  const { error } = await c.rpc('unfollow_vendor', { p_vendor_id: vendorId, p_society_id: societyId ?? undefined });
  if (error) raise(error);
}

export type FollowingRow = {
  vendor_id: string; society_id: string; society_name: string; notify_arrival: boolean; notify_deals: boolean; notify_requests: boolean;
  display_name: string; photo_path: string | null; vehicle: 'tempo' | 'thela'; delivery_available: boolean; avg_rating: number; rating_count: number;
  today: { status: HomeVendor['status']; status_at: string | null; gate_name: string; window_start: string; window_end: string } | null;
};
export async function myFollowing(c: Client = getSupabase()): Promise<FollowingRow[]> {
  const { data, error } = await c.rpc('my_following');
  if (error) raise(error);
  return (data ?? []) as unknown as FollowingRow[];
}

export type NotificationRow = { id: string; type: string; payload: Record<string, unknown>; sent_at: string; opened_at: string | null };
export async function myNotifications(c: Client = getSupabase()): Promise<NotificationRow[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await c.from('notifications').select('id, type, payload, sent_at, opened_at').gte('sent_at', since).order('sent_at', { ascending: false });
  if (error) raise(error);
  return (data ?? []) as NotificationRow[];
}

export async function markOpened(id: string, c: Client = getSupabase()) {
  await c.rpc('mark_notification_opened', { p_id: id });
}
