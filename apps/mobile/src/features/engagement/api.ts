import type { PriceUnit, RequestLite, ReviewInput } from '@sabzi/shared';
import { getSupabase, type Client } from '../../lib/supabase';
import { raise } from '../../lib/errors';
import { newClientId } from '../../lib/ids';
import type { PublicReview } from '../buyer/api';
import type { HomeVendor } from '../buyer/types';

export async function allReviews(vendorId: string, c: Client = getSupabase()): Promise<PublicReview[]> {
  const { data, error } = await c.from('v_review_public').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (error) raise(error);
  return (data ?? []) as unknown as PublicReview[];
}

export type Eligibility =
  | { state: 'eligible' }
  | { state: 'not_following' }
  | { state: 'too_soon'; unlocks_at: string; days_left: number }
  | { state: 'locked'; review_id: string; unlocks_at: string }
  | { state: 'can_edit'; review_id: string; unlocks_at: string };

export async function reviewEligibility(vendorId: string, c: Client = getSupabase()): Promise<Eligibility> {
  const { data, error } = await c.rpc('review_eligibility', { p_vendor_id: vendorId });
  if (error) raise(error);
  return data as unknown as Eligibility;
}

export async function myReviewFor(vendorId: string, c: Client = getSupabase()) {
  const { data } = await c.from('reviews').select('id, stars, tags, text, status, hidden_reason, updated_at').eq('vendor_id', vendorId).maybeSingle();
  return data;
}

export async function submitReview(input: ReviewInput, c: Client = getSupabase()) {
  const { error } = await c.rpc('submit_review', { p_vendor_id: input.vendor_id, p_stars: input.stars, p_tags: input.tags, p_text: input.text ?? undefined });
  if (error) raise(error);
}

export type Item = { id: string; name: string; default_unit: PriceUnit };
export async function itemsList(c: Client = getSupabase()): Promise<Item[]> {
  const { data, error } = await c.from('items').select('id, name, default_unit').eq('approved', true).order('name');
  if (error) raise(error);
  return (data ?? []) as Item[];
}

export async function createRequest(p: { vendor_id: string; society_id: string; item_id?: string | null; free_text?: string | null; qty?: string | null; note?: string | null }, c: Client = getSupabase()) {
  const { error } = await c.rpc('create_request', {
    p_vendor_id: p.vendor_id,
    p_society_id: p.society_id,
    p_item_id: p.item_id ?? undefined,
    p_free_text: p.free_text ?? undefined,
    p_qty: p.qty ?? undefined,
    p_note: p.note ?? undefined,
  });
  if (error) raise(error);
}

export type MyRequest = { id: string; vendor_id: string; vendor_name: string; society_name: string; item_id: string | null; item_name: string; qty: string | null; note: string | null; for_date: string; status: 'open' | 'will_bring' | 'cant_bring'; created_at: string };
export async function myRequests(c: Client = getSupabase()): Promise<MyRequest[]> {
  const { data, error } = await c.rpc('my_requests');
  if (error) raise(error);
  return (data ?? []) as unknown as MyRequest[];
}

export async function cancelRequest(id: string, c: Client = getSupabase()) {
  const { error } = await c.rpc('cancel_request', { p_request_id: id });
  if (error) raise(error);
}

export type DealRow = { vendor_id: string; vendor_name: string; photo_path: string | null; sent_at: string; society_id: string; today: { status: HomeVendor['status']; gate_name: string; status_at: string | null; window_start: string; window_end: string } | null; items: { item_id: string; name: string; price: number; unit: PriceUnit; deal_price: number; sold_out: boolean }[] };
export async function myDealsToday(c: Client = getSupabase()): Promise<DealRow[]> {
  const { data, error } = await c.rpc('my_deals_today');
  if (error) raise(error);
  return (data ?? []) as unknown as DealRow[];
}

export async function reportVendor(vendorId: string, reason: string, text: string | null, photoPath: string | null, c: Client = getSupabase()) {
  const { error } = await c.rpc('report_vendor', { p_vendor_id: vendorId, p_reason: reason as never, p_text: text ?? undefined, p_photo_path: photoPath ?? undefined });
  if (error) raise(error);
}

// ---- vendor side
export async function vendorRequests(c: Client = getSupabase()): Promise<(RequestLite & { for_date: string })[]> {
  const { data, error } = await c.from('v_vendor_requests').select('id, item_id, item_name, free_text, qty, note, buyer_first_name, society_name, status, for_date');
  if (error) raise(error);
  return (data ?? []) as unknown as (RequestLite & { for_date: string })[];
}

export async function answerRequest(key: string, status: 'will_bring' | 'cant_bring', forDate: string, c: Client = getSupabase()) {
  const { data, error } = await c.rpc('answer_request', { p_item_key: key, p_status: status, p_for_date: forDate });
  if (error) raise(error);
  return data as number;
}

export async function sendDeal(items: { item_id: string; deal_price: number }[], clientId = newClientId(), c: Client = getSupabase()) {
  const { data, error } = await c.rpc('send_deal', { p_items: items, p_client_id: clientId });
  if (error) raise(error);
  return data as unknown as { deal_id: string; followers: number };
}

export async function myDealToday(c: Client = getSupabase()): Promise<{ sent_at: string; followers: number } | null> {
  const { data } = await c.rpc('my_deal_today');
  return (data as { sent_at: string; followers: number } | null) ?? null;
}
