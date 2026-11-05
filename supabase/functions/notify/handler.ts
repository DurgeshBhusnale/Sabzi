import {
  arrivalMessage,
  dealMessage,
  leavingSoonMessage,
  notComingMessage,
  pushAllowedNow,
  requestReplyMessage,
  vendorRatingMessage,
  vendorRequestsMessage,
  type Message,
  type MsgItem,
  type NotifKind,
} from '@sabzi/shared/notifications.ts';
import { LIMITS, REVIEW_TAG_LABELS, type ReviewTag } from '@sabzi/shared/constants.ts';
import { json, type Env } from '../_shared/http.ts';

export type Recipient = {
  user_id: string;
  push_token: string | null;
  notify_arrival?: boolean;
  notify_deals?: boolean;
  notify_requests?: boolean;
  prefs?: Partial<Record<'arrival' | 'deals' | 'replies' | 'vendor_requests' | 'vendor_ratings', boolean>> | null;
  deleted?: boolean;
  society_id?: string;
};

type Menu = { stock_photo_path: string | null; items: MsgItem[] } | null;

export type Context = {
  event?: { id: string; type: 'arrived' | 'leaving_soon' | 'not_going'; created_at: string };
  deal?: { id: string };
  request?: { id: string; status: 'will_bring' | 'cant_bring'; qty: string | null; item: string };
  review?: { id: string; stars: number; tags: string[]; text: string | null; society: string | null };
  vendor: { id: string; display_name: string; verified: boolean };
  gate?: { id: string; name: string };
  society?: { id: string; name: string };
  menu?: Menu;
  groups?: { name: string; count: number }[];
  recipients: Recipient[];
};

export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high' | 'normal';
  channelId: string;
  data: Record<string, string>;
  richContent?: { image: string };
};

export type NotifyDeps = {
  env: Env;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  context: (kind: string, ref: string) => Promise<Context | null>;
  /** Inserts notification rows and returns their ids in the same order. */
  insertNotifications: (rows: { user_id: string; type: NotifKind; payload: Record<string, unknown> }[]) => Promise<string[]>;
  sendExpo: (batch: ExpoMessage[]) => Promise<void>;
  log?: (msg: string) => void;
};

const pref = (r: Recipient, k: keyof NonNullable<Recipient['prefs']>) => r.prefs?.[k] !== false;

/** Who gets a notification for each kind (BUY-4 per-vendor flags + S-13 global prefs; deleted accounts never). */
export function selectRecipients(kind: NotifKind, recipients: Recipient[]): Recipient[] {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    if (r.deleted || seen.has(r.user_id)) return false;
    let ok: boolean;
    switch (kind) {
      case 'arrival':
      case 'leaving_soon':
      case 'not_coming':
        ok = r.notify_arrival !== false && pref(r, 'arrival');
        break;
      case 'deal':
        ok = r.notify_deals !== false && pref(r, 'deals');
        break;
      case 'request_reply':
        ok = r.notify_requests !== false && pref(r, 'replies');
        break;
      case 'vendor_new_requests':
        ok = pref(r, 'vendor_requests');
        break;
      case 'vendor_new_rating':
        ok = pref(r, 'vendor_ratings');
        break;
    }
    if (ok) seen.add(r.user_id);
    return ok;
  });
}

export function buildMessage(kind: NotifKind, c: Context): Message {
  const vendor = c.vendor.display_name;
  const items = c.menu?.items ?? [];
  switch (kind) {
    case 'arrival':
      return arrivalMessage(vendor, c.gate!.name, items);
    case 'leaving_soon':
      return leavingSoonMessage(vendor, c.gate!.name, items);
    case 'not_coming':
      return notComingMessage(vendor, c.society!.name);
    case 'deal':
      return dealMessage(vendor, items);
    case 'request_reply':
      return requestReplyMessage(vendor, c.request!.item, c.request!.qty, c.request!.status === 'will_bring');
    case 'vendor_new_requests':
      return vendorRequestsMessage(c.groups ?? []);
    case 'vendor_new_rating':
      return vendorRatingMessage(c.review!.stars, c.review!.society, c.review!.text, c.review!.tags.map((t) => REVIEW_TAG_LABELS[t as ReviewTag] ?? t));
  }
}

function kindFor(input: string, c: Context): NotifKind | null {
  if (input === 'stop_event') return c.event?.type === 'arrived' ? 'arrival' : c.event?.type === 'leaving_soon' ? 'leaving_soon' : c.event?.type === 'not_going' ? 'not_coming' : null;
  if (input === 'deal') return 'deal';
  if (input === 'request_reply') return 'request_reply';
  if (input === 'rating') return 'vendor_new_rating';
  if (input === 'vendor_requests') return 'vendor_new_requests';
  return null;
}

export function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

/** Edge function `notify`: called by Postgres triggers via pg_net with { kind, ref }. */
export async function handleNotify(req: Request, deps: NotifyDeps): Promise<Response> {
  const t0 = Date.now();
  const secret = deps.env('NOTIFY_SECRET');
  if (secret && req.headers.get('x-notify-secret') !== secret) return json({ error: 'forbidden' }, 403);
  const body = (await req.json().catch(() => null)) as { kind?: string; ref?: string } | null;
  if (!body?.kind || !body.ref) return json({ error: 'invalid_input' }, 400);

  let ctx = await deps.context(body.kind, body.ref);
  if (!ctx) return json({ skipped: 'not_found' });

  // VEN-8 undo: wait out the 5 s undo window for arrivals, then make sure the event still exists.
  if (body.kind === 'stop_event' && ctx.event?.type === 'arrived') {
    const wait = Number(deps.env('UNDO_WAIT_MS') ?? LIMITS.undoSeconds * 1000 + 500);
    const elapsed = deps.now().getTime() - Date.parse(ctx.event.created_at);
    if (wait - elapsed > 0) await deps.sleep(wait - elapsed);
    ctx = await deps.context(body.kind, body.ref);
    if (!ctx) return json({ skipped: 'undone' });
  }
  if (!ctx.vendor.verified) return json({ skipped: 'vendor_not_verified' });

  const kind = kindFor(body.kind, ctx);
  if (!kind) return json({ skipped: 'no_notification_for_event' });
  const recipients = selectRecipients(kind, ctx.recipients);
  if (recipients.length === 0) return json({ sent: 0, recipients: 0 });

  const msg = buildMessage(kind, ctx);
  const payloadBase: Record<string, string> = { title: msg.title, body: msg.body, vendor_id: ctx.vendor.id };
  if (ctx.society) payloadBase.society_id = ctx.society.id;
  if (ctx.event) payloadBase.event_id = ctx.event.id;
  if (ctx.deal) payloadBase.deal_id = ctx.deal.id;
  if (ctx.request) payloadBase.request_id = ctx.request.id;

  const ids = await deps.insertNotifications(recipients.map((r) => ({ user_id: r.user_id, type: kind, payload: { ...payloadBase, ...(r.society_id ? { society_id: r.society_id } : {}) } })));

  if (!pushAllowedNow(kind, deps.now())) {
    deps.log?.(`[notify] ${kind}: quiet hours, ${ids.length} in-app only`);
    return json({ sent: 0, recipients: recipients.length, quiet: true });
  }

  const photo = ctx.menu?.stock_photo_path && deps.env('SUPABASE_URL') ? `${deps.env('SUPABASE_URL')}/storage/v1/object/public/stock-photos/${ctx.menu.stock_photo_path}` : null;
  const messages: ExpoMessage[] = [];
  recipients.forEach((r, i) => {
    if (!r.push_token) return;
    messages.push({
      to: r.push_token,
      title: msg.title,
      body: msg.body,
      sound: 'default',
      priority: kind === 'arrival' || kind === 'leaving_soon' ? 'high' : 'normal',
      channelId: kind === 'arrival' || kind === 'leaving_soon' ? 'arrivals' : 'updates',
      data: { ...payloadBase, notification_id: ids[i]!, type: kind, ...(r.society_id ? { society_id: r.society_id } : {}) },
      ...(photo && kind === 'arrival' ? { richContent: { image: photo } } : {}),
    });
  });
  for (const batch of chunk(messages, LIMITS.pushBatchSize)) await deps.sendExpo(batch);
  deps.log?.(`[notify] ${kind}: ${messages.length} pushes to Expo in ${Date.now() - t0} ms after wait`);
  return json({ sent: messages.length, recipients: recipients.length });
}

/** Expo Push API sender (https://exp.host/--/api/v2/push/send). */
export function expoSender(env: Env, fetchImpl: typeof fetch = fetch) {
  return async (batch: ExpoMessage[]) => {
    const token = env('EXPO_ACCESS_TOKEN');
    const res = await fetchImpl('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`expo push failed: ${res.status}`);
  };
}
