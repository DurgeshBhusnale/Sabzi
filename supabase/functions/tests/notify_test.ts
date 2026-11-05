import { assert, assertEquals } from '@std/assert';
import { chunk, handleNotify, selectRecipients, type Context, type ExpoMessage, type NotifyDeps, type Recipient } from '../notify/handler.ts';

const menu = {
  stock_photo_path: 'v/2026-11-05.jpg',
  items: [
    { name: 'Tomato', price: 40, unit: 'kg' as const },
    { name: 'Onion', price: 30, unit: 'kg' as const },
    { name: 'Methi (fenugreek)', price: 15, unit: 'bunch' as const },
    ...Array.from({ length: 9 }, (_, i) => ({ name: `Item ${i}`, price: 20, unit: 'kg' as const })),
  ],
};
const r = (id: string, o: Partial<Recipient> = {}): Recipient => ({ user_id: id, push_token: `ExponentPushToken[${id}]`, notify_arrival: true, notify_deals: true, notify_requests: true, prefs: {}, deleted: false, ...o });

function arrivalCtx(recipients: Recipient[], createdAt = '2026-11-05T02:35:00Z'): Context {
  return {
    event: { id: 'e1', type: 'arrived', created_at: createdAt },
    vendor: { id: 'v1', display_name: 'Ramesh Sabzi', verified: true },
    gate: { id: 'g1', name: 'Gate 1' },
    society: { id: 's1', name: 'Green Park Residency' },
    menu,
    recipients,
  };
}

function deps(ctx: Context | null, o: Partial<NotifyDeps> = {}) {
  const sent: ExpoMessage[][] = [];
  const inserted: { user_id: string; type: string; payload: Record<string, unknown> }[] = [];
  const d: NotifyDeps = {
    env: (k) => ({ UNDO_WAIT_MS: '0', SUPABASE_URL: 'http://sb' } as Record<string, string>)[k],
    now: () => new Date('2026-11-05T02:35:10Z'), // 8:05 AM IST
    sleep: () => Promise.resolve(),
    context: () => Promise.resolve(ctx),
    insertNotifications: (rows) => {
      inserted.push(...rows);
      return Promise.resolve(rows.map((_, i) => `n${inserted.length - rows.length + i}`));
    },
    sendExpo: (b) => {
      sent.push(b);
      return Promise.resolve();
    },
    ...o,
  };
  return { d, sent, inserted };
}

const req = (body: unknown, headers: Record<string, string> = {}) => new Request('http://x/notify', { method: 'POST', body: JSON.stringify(body), headers });

Deno.test('arrival: correct followers, opt-outs and global prefs respected, deleted skipped', async () => {
  const ctx = arrivalCtx([
    r('priya'),
    r('arjun', { notify_arrival: false }),
    r('meera', { prefs: { arrival: false } }),
    r('gone', { deleted: true }),
    r('notoken', { push_token: null }),
  ]);
  const { d, sent, inserted } = deps(ctx);
  const res = await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), d);
  assertEquals(res.status, 200);
  assertEquals(inserted.map((i) => i.user_id), ['priya', 'notoken'], 'in-app rows for everyone selected');
  assertEquals(sent.flat().map((m) => m.to), ['ExponentPushToken[priya]'], 'push only where a token exists');
  const m = sent[0]![0]!;
  assertEquals(m.title, 'Ramesh is at Gate 1 now');
  assertEquals(m.body, 'Tomato ₹40/kg · Onion ₹30/kg · Methi ₹15/bunch + 9 more');
  assertEquals(m.data.type, 'arrival');
  assertEquals(m.data.notification_id, 'n0');
  assertEquals(m.richContent?.image, 'http://sb/storage/v1/object/public/stock-photos/v/2026-11-05.jpg');
});

Deno.test('arrival waits for the undo window and skips undone events', async () => {
  let calls = 0;
  let slept = 0;
  const { d, sent } = deps(null, {
    env: (k) => ({ UNDO_WAIT_MS: '5500' } as Record<string, string>)[k],
    now: () => new Date('2026-11-05T02:35:01Z'),
    sleep: (ms) => {
      slept = ms;
      return Promise.resolve();
    },
    context: () => Promise.resolve(calls++ === 0 ? arrivalCtx([r('priya')], '2026-11-05T02:35:00Z') : null),
  });
  const res = await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), d);
  assertEquals((await res.json()).skipped, 'undone');
  assertEquals(slept, 4500);
  assertEquals(sent.length, 0);
});

Deno.test('deal: quiet hours keep in-app rows but send no push; daytime pushes', async () => {
  const ctx: Context = {
    deal: { id: 'd1' },
    vendor: { id: 'v1', display_name: 'Ramesh Sabzi', verified: true },
    menu: { stock_photo_path: null, items: [{ name: 'Tomato', price: 40, unit: 'kg', deal_price: 30 }, { name: 'Coriander', price: 10, unit: 'bunch', deal_price: 5 }] },
    recipients: [r('priya'), r('arjun', { notify_deals: false }), r('meera', { prefs: { deals: false } })],
  };
  const night = deps(ctx, { now: () => new Date('2026-11-05T16:00:00Z') }); // 21:30 IST
  const res = await handleNotify(req({ kind: 'deal', ref: 'd1' }), night.d);
  assertEquals((await res.json()).quiet, true);
  assertEquals(night.inserted.length, 1);
  assertEquals(night.sent.length, 0);

  const day = deps(ctx, { now: () => new Date('2026-11-05T12:00:00Z') }); // 17:30 IST
  await handleNotify(req({ kind: 'deal', ref: 'd1' }), day.d);
  assertEquals(day.sent.flat().length, 1);
  assertEquals(day.sent[0]![0]!.title, 'Evening deal from Ramesh');
  assertEquals(day.sent[0]![0]!.body, 'Tomato now ₹30/kg (was ₹40) · Coriander ₹5/bunch');
});

Deno.test('arrival alerts are sent even during quiet hours', async () => {
  const { d, sent } = deps(arrivalCtx([r('priya')], '2026-11-05T16:00:00Z'), { now: () => new Date('2026-11-05T16:00:10Z') });
  await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), d);
  assertEquals(sent.flat().length, 1);
});

Deno.test('leaving soon and not coming copy', async () => {
  const leaving = deps({ ...arrivalCtx([r('priya')]), event: { id: 'e2', type: 'leaving_soon', created_at: '2026-11-05T02:50:00Z' }, menu: { stock_photo_path: null, items: [{ name: 'Tomato', price: 40, unit: 'kg' }, { name: 'Bhindi (okra)', price: 60, unit: 'kg' }, { name: 'Palak (spinach)', price: 15, unit: 'bunch' }] } });
  await handleNotify(req({ kind: 'stop_event', ref: 'e2' }), leaving.d);
  assertEquals(leaving.sent[0]![0]!.title, 'Ramesh leaves Gate 1 in 10 min');
  assertEquals(leaving.sent[0]![0]!.body, 'Still has tomato, bhindi, palak');

  const notComing = deps({ ...arrivalCtx([r('priya')]), event: { id: 'e3', type: 'not_going', created_at: '2026-11-05T01:00:00Z' } });
  await handleNotify(req({ kind: 'stop_event', ref: 'e3' }), notComing.d);
  assertEquals(notComing.sent[0]![0]!.title, "Ramesh isn't coming to Green Park today");
  assertEquals(notComing.sent[0]![0]!.body, "We'll tell you when he's back");
});

Deno.test('request reply respects notify_requests and replies pref', async () => {
  const ctx = (rec: Recipient): Context => ({
    request: { id: 'q1', status: 'will_bring', qty: '500 g', item: 'Drumsticks' },
    vendor: { id: 'v1', display_name: 'Ramesh Sabzi', verified: true },
    recipients: [rec],
  });
  const on = deps(ctx(r('priya')), { now: () => new Date('2026-11-05T11:00:00Z') });
  await handleNotify(req({ kind: 'request_reply', ref: 'q1' }), on.d);
  assertEquals(on.sent[0]![0]!.title, 'Ramesh will bring drumsticks tomorrow');
  assertEquals(on.sent[0]![0]!.body, 'Your request for 500 g');
  const off = deps(ctx(r('priya', { prefs: { replies: false } })));
  await handleNotify(req({ kind: 'request_reply', ref: 'q1' }), off.d);
  assertEquals(off.inserted.length, 0);
});

Deno.test('vendor digest and rating copy', async () => {
  const digest = deps({ vendor: { id: 'v1', display_name: 'Ramesh Sabzi', verified: true }, groups: [{ name: 'Drumsticks', count: 3 }, { name: 'Broccoli', count: 2 }, { name: 'Baby corn', count: 1 }], recipients: [r('v1')] }, { now: () => new Date('2026-11-05T10:30:00Z') });
  await handleNotify(req({ kind: 'vendor_requests', ref: 'v1' }), digest.d);
  assertEquals(digest.sent[0]![0]!.title, '6 requests for tomorrow');
  assertEquals(digest.sent[0]![0]!.body, 'Drumsticks ×3, Broccoli ×2, Baby corn ×1');
  const rating = deps({ vendor: { id: 'v1', display_name: 'Ramesh Sabzi', verified: true }, review: { id: 'rv', stars: 5, tags: [], text: 'Always fresh, correct weight', society: 'Green Park Residency' }, recipients: [r('v1')] }, { now: () => new Date('2026-11-05T10:30:00Z') });
  await handleNotify(req({ kind: 'rating', ref: 'rv' }), rating.d);
  assertEquals(rating.sent[0]![0]!.title, 'New 5★ rating from Green Park');
  assertEquals(rating.sent[0]![0]!.body, '"Always fresh, correct weight"');
});

Deno.test('batches of 100', async () => {
  const many = Array.from({ length: 250 }, (_, i) => r(`b${i}`));
  const { d, sent } = deps(arrivalCtx(many));
  await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), d);
  assertEquals(sent.map((b) => b.length), [100, 100, 50]);
  assertEquals(chunk([1, 2, 3], 2), [[1, 2], [3]]);
});

Deno.test('unverified vendors and wrong secrets send nothing', async () => {
  const unv = deps({ ...arrivalCtx([r('priya')]), vendor: { id: 'v', display_name: 'Ganesh', verified: false } });
  assertEquals((await (await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), unv.d)).json()).skipped, 'vendor_not_verified');
  const sec = deps(arrivalCtx([r('priya')]), { env: (k) => ({ NOTIFY_SECRET: 's3cret', UNDO_WAIT_MS: '0' } as Record<string, string>)[k] });
  assertEquals((await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), sec.d)).status, 403);
  assertEquals((await handleNotify(req({ kind: 'stop_event', ref: 'e1' }, { 'x-notify-secret': 's3cret' }), sec.d)).status, 200);
});

Deno.test('NOT-2 timing: arrival → Expo request in under 2 s (excluding the 5 s undo window)', async () => {
  const many = Array.from({ length: 500 }, (_, i) => r(`b${i}`));
  let firstSendAt = 0;
  const t0 = performance.now();
  const { d } = deps(arrivalCtx(many), {
    sendExpo: () => {
      if (!firstSendAt) firstSendAt = performance.now();
      return new Promise((res) => setTimeout(res, 5)); // simulated network
    },
  });
  await handleNotify(req({ kind: 'stop_event', ref: 'e1' }), d);
  const ms = firstSendAt - t0;
  console.log(`arrival → first Expo push request: ${ms.toFixed(1)} ms for 500 followers`);
  assert(ms < 2000);
});

Deno.test('selectRecipients de-duplicates a buyer following at two societies', () => {
  assertEquals(selectRecipients('deal', [r('a', { society_id: 's1' }), r('a', { society_id: 's2' })]).length, 1);
});
