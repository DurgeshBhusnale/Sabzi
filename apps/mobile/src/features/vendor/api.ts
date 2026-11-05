import { addDays, toIstDate, type PriceUnit, type VendorProfileInput } from '@sabzi/shared';
import { getSupabase, type Client } from '../../lib/supabase';
import { raise } from '../../lib/errors';
import { newClientId } from '../../lib/ids';
import type { TodayStop } from './arrival';
import type { MenuLine, UsualItem } from './menuLogic';

export type VendorStatus = 'pending' | 'needs_info' | 'verified' | 'rejected' | 'suspended';

export type MyVendor = {
  user_id: string;
  display_name: string;
  photo_path: string | null;
  vehicle: 'tempo' | 'thela';
  vehicle_no: string | null;
  pmc_vendor_id: string | null;
  pmc_doc_path: string | null;
  delivery_available: boolean;
  allow_calls: boolean;
  status: VendorStatus;
  status_reason: string | null;
  verified_seen_at: string | null;
  code: string;
};

export async function getMyVendor(c: Client = getSupabase()): Promise<MyVendor | null> {
  const { data, error } = await c.from('vendors').select('*').maybeSingle();
  if (error) raise(error);
  return (data as MyVendor | null) ?? null;
}

/** V-01: create or update the business profile (status, code and verification are server-owned). */
export async function saveVendorProfile(input: VendorProfileInput & { photo_path?: string | null; pmc_doc_path?: string | null }, c: Client = getSupabase()): Promise<void> {
  const { data: u } = await c.auth.getUser();
  const uid = u.user?.id;
  if (!uid) raise({ message: 'not_authenticated' });
  const existing = await getMyVendor(c);
  const row = {
    display_name: input.display_name,
    vehicle: input.vehicle,
    vehicle_no: input.vehicle_no || null,
    pmc_vendor_id: input.pmc_vendor_id || null,
    delivery_available: input.delivery_available,
    allow_calls: input.allow_calls,
    ...(input.photo_path !== undefined ? { photo_path: input.photo_path } : {}),
    ...(input.pmc_doc_path !== undefined ? { pmc_doc_path: input.pmc_doc_path } : {}),
  };
  const { error } = existing
    ? await c.from('vendors').update(row).eq('user_id', uid!)
    : await c.from('vendors').insert({ user_id: uid!, ...row });
  if (error) raise(error);
}

export type Item = { id: string; name: string; default_unit: PriceUnit; approved: boolean; image_path: string | null };

export async function listItems(c: Client = getSupabase()): Promise<Item[]> {
  const { data, error } = await c.from('items').select('id, name, default_unit, approved, image_path').order('name');
  if (error) raise(error);
  return (data ?? []) as Item[];
}

export async function getUsualItems(c: Client = getSupabase()): Promise<UsualItem[]> {
  const { data, error } = await c.from('vendor_items').select('sort, items(id, name, default_unit)').order('sort');
  if (error) raise(error);
  return (data ?? []).map((r) => {
    const it = r.items as unknown as { id: string; name: string; default_unit: PriceUnit };
    return { id: it.id, name: it.name, defaultUnit: it.default_unit };
  });
}

/** V-02: replace the usual items list. */
export async function setUsualItems(ids: string[], c: Client = getSupabase()): Promise<void> {
  const { data: u } = await c.auth.getUser();
  const uid = u.user!.id;
  const del = await c.from('vendor_items').delete().eq('vendor_id', uid);
  if (del.error) raise(del.error);
  if (ids.length === 0) return;
  const { error } = await c.from('vendor_items').insert(ids.map((item_id, i) => ({ vendor_id: uid, item_id, sort: i + 1 })));
  if (error) raise(error);
}

/** V-02 "Add an item not listed": the team approves it into the master list later. */
export async function addCustomItem(name: string, unit: PriceUnit, c: Client = getSupabase()): Promise<Item> {
  const { data: u } = await c.auth.getUser();
  const { data, error } = await c
    .from('items')
    .insert({ name: name.trim(), default_unit: unit, is_custom: true, approved: false, created_by: u.user!.id })
    .select('id, name, default_unit, approved, image_path')
    .single();
  if (error) raise(error);
  return data as Item;
}

export type DayMenu = { id: string; date: string; publishedAt: string | null; updatedAt: string; stockPhotoPath: string | null; stockPhotoAt: string | null; lines: (MenuLine & { name: string; dealPrice: number | null })[] };

export async function getMenu(date: string, c: Client = getSupabase()): Promise<DayMenu | null> {
  const { data: u } = await c.auth.getUser();
  const { data, error } = await c
    .from('daily_menus')
    .select('id, date, published_at, updated_at, stock_photo_path, stock_photo_at, menu_items(item_id, price, unit, is_sold_out, deal_price, sort, items(name))')
    .eq('vendor_id', u.user!.id)
    .eq('date', date)
    .maybeSingle();
  if (error) raise(error);
  if (!data) return null;
  const lines = (data.menu_items ?? [])
    .sort((a, b) => a.sort - b.sort)
    .map((m) => ({
      itemId: m.item_id,
      price: Number(m.price),
      unit: m.unit as PriceUnit,
      soldOut: m.is_sold_out,
      dealPrice: m.deal_price == null ? null : Number(m.deal_price),
      name: (m.items as unknown as { name: string }).name,
    }));
  return { id: data.id, date: data.date, publishedAt: data.published_at, updatedAt: data.updated_at, stockPhotoPath: data.stock_photo_path, stockPhotoAt: data.stock_photo_at, lines };
}

export const todayIst = () => toIstDate();
export const yesterdayIst = () => addDays(toIstDate(), -1);

export async function publishMenu(items: { item_id: string; price: number; unit: PriceUnit }[], clientId = newClientId(), c: Client = getSupabase()) {
  const { data, error } = await c.rpc('publish_menu', { p_date: todayIst(), p_items: items, p_client_id: clientId });
  if (error) raise(error);
  return data as { menu_id: string; items: number; followers: number };
}

export async function setSoldOut(itemId: string, soldOut: boolean, clientId = newClientId(), c: Client = getSupabase()) {
  const { error } = await c.rpc('set_sold_out', { p_item_id: itemId, p_sold_out: soldOut, p_client_id: clientId });
  if (error) raise(error);
}

export async function setStockPhoto(path: string, clientId = newClientId(), c: Client = getSupabase()) {
  const { error } = await c.rpc('set_stock_photo', { p_path: path, p_client_id: clientId });
  if (error) raise(error);
}

export async function getStopsToday(c: Client = getSupabase()): Promise<TodayStop[]> {
  const { data, error } = await c.rpc('my_stops_today');
  if (error) raise(error);
  return (data ?? []).map((r) => ({
    stopId: r.stop_id,
    gateId: r.gate_id,
    gateName: r.gate_name,
    societyName: r.society_name,
    lat: r.gate_lat,
    lng: r.gate_lng,
    windowStart: r.window_start,
    windowEnd: r.window_end,
    followers: r.followers,
    skipped: r.skipped,
    arrivedAt: r.arrived_at,
    leftAt: r.left_at,
    leavingAt: r.leaving_at,
    lastArrivalAt: r.last_arrival_at,
    arrivalEventId: r.arrival_event_id,
  }));
}

export type WeekStop = { stopId: string; gateName: string; societyName: string; days: number[]; windowStart: string; windowEnd: string };
export async function getStopsWeek(c: Client = getSupabase()): Promise<WeekStop[]> {
  const { data, error } = await c.rpc('my_stops_week');
  if (error) raise(error);
  return (data ?? []).map((r) => ({ stopId: r.stop_id, gateName: r.gate_name, societyName: r.society_name, days: r.days_of_week, windowStart: r.window_start, windowEnd: r.window_end }));
}

export async function arrive(gateId: string, pos: { lat: number; lng: number } | null, clientId = newClientId(), c: Client = getSupabase()) {
  const { data, error } = await c.rpc('vendor_arrive', { p_gate_id: gateId, p_lat: pos?.lat ?? undefined, p_lng: pos?.lng ?? undefined, p_client_id: clientId });
  if (error) raise(error);
  return data as { event_id: string; followers: number; duplicate: boolean };
}

export async function undoStopEvent(eventId: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('undo_stop_event', { p_event_id: eventId });
  if (error) raise(error);
}

export async function leavingSoon(gateId: string, clientId = newClientId(), c: Client = getSupabase()) {
  const { data, error } = await c.rpc('vendor_leaving_soon', { p_gate_id: gateId, p_client_id: clientId });
  if (error) raise(error);
  return data as { event_id: string };
}

export async function left(gateId: string, clientId = newClientId(), c: Client = getSupabase()) {
  const { error } = await c.rpc('vendor_left', { p_gate_id: gateId, p_client_id: clientId });
  if (error) raise(error);
}

export async function skipStop(stopId: string, c: Client = getSupabase()) {
  const { data, error } = await c.rpc('skip_stop', { p_stop_id: stopId });
  if (error) raise(error);
  return data as { followers: number };
}

export async function unskipStop(stopId: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('unskip_stop', { p_stop_id: stopId });
  if (error) raise(error);
}

export type VendorStats = { followers: number; followers_week_change: number; alert_opens_today: number; profile_views_week: number; avg_rating: number; rating_count: number };
export async function getStats(c: Client = getSupabase()): Promise<VendorStats> {
  const { data, error } = await c.rpc('my_vendor_stats');
  if (error) raise(error);
  return data as unknown as VendorStats;
}

export async function getFollowerCounts(c: Client = getSupabase()) {
  const { data, error } = await c.rpc('my_follower_counts');
  if (error) raise(error);
  return (data ?? []) as { society_id: string; society_name: string; followers: number }[];
}

export async function eventOpenCount(eventId: string, c: Client = getSupabase()): Promise<number> {
  const { data } = await c.rpc('event_open_count', { p_event_id: eventId });
  return (data as number | null) ?? 0;
}

export async function markVerifiedSeen(c: Client = getSupabase()) {
  await c.rpc('mark_verified_seen');
}

export type MyReview = { id: string; reviewer_name: string; society_name: string | null; stars: number; tags: string[]; text: string | null; vendor_reply: string | null; created_at: string };
export async function getMyReviews(c: Client = getSupabase()): Promise<MyReview[]> {
  const { data: u } = await c.auth.getUser();
  const { data, error } = await c
    .from('v_review_public')
    .select('id, reviewer_name, society_name, stars, tags, text, vendor_reply, created_at')
    .eq('vendor_id', u.user!.id)
    .order('created_at', { ascending: false });
  if (error) raise(error);
  return (data ?? []) as MyReview[];
}

export async function replyReview(reviewId: string, text: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('reply_review', { p_review_id: reviewId, p_text: text });
  if (error) raise(error);
}

export async function flagReview(reviewId: string, reason: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('flag_review', { p_review_id: reviewId, p_reason: reason });
  if (error) raise(error);
}
