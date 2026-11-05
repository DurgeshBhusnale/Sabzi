import { assert, assertEquals } from '@std/assert';
import { handleOtpVerify, type OtpVerifyDeps } from '../otp-verify/handler.ts';
import { handleSendSms } from '../send-sms-hook/handler.ts';
import { buildMsg91Request } from '../_shared/msg91.ts';
import { signWebhook, verifyWebhook } from '../_shared/webhook.ts';

/** In-memory model of the SQL otp_* functions: 5 failures → blocked 60 minutes */
function fakeOtpStore(now: () => number) {
  const rows = new Map<string, { failures: number; blockedUntil: number | null }>();
  const key = (p: string) => p.replace(/\D/g, '');
  return {
    rows,
    blockedUntil: (p: string) => {
      const r = rows.get(key(p));
      return Promise.resolve(r?.blockedUntil && r.blockedUntil > now() ? new Date(r.blockedUntil).toISOString() : null);
    },
    recordFailure: (p: string) => {
      const r = rows.get(key(p)) ?? { failures: 0, blockedUntil: null };
      r.failures += 1;
      if (r.failures >= 5 && !r.blockedUntil) r.blockedUntil = now() + 60 * 60_000;
      rows.set(key(p), r);
      return Promise.resolve(r.blockedUntil ? new Date(r.blockedUntil).toISOString() : null);
    },
    recordSuccess: (p: string) => {
      rows.delete(key(p));
      return Promise.resolve();
    },
    failuresSoFar: (p: string) => Promise.resolve(rows.get(key(p))?.failures ?? 0),
  };
}

const post = (body: unknown) =>
  new Request('http://x/otp-verify', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

Deno.test('otp-verify: 5 wrong codes block the number for 1 hour', async () => {
  let t = Date.parse('2026-11-05T01:00:00Z');
  const store = fakeOtpStore(() => t);
  const deps: OtpVerifyDeps = {
    ...store,
    maxFailures: 5,
    verify: (_p, token) => Promise.resolve(token === '123456' ? { ok: true, session: { access_token: 'x' } } : { ok: false, code: 'otp_invalid' }),
  };
  for (let i = 1; i <= 4; i++) {
    const res = await handleOtpVerify(post({ phone: '+919999900021', token: '000000' }), deps);
    assertEquals(res.status, 400);
    assertEquals((await res.json()).attempts_left, 5 - i);
  }
  const fifth = await handleOtpVerify(post({ phone: '+919999900021', token: '000000' }), deps);
  assertEquals(fifth.status, 429);
  assertEquals((await fifth.json()).error, 'otp_blocked');
  // Even the right code is refused while blocked
  const blocked = await handleOtpVerify(post({ phone: '+919999900021', token: '123456' }), deps);
  assertEquals(blocked.status, 429);
  // After an hour it works again
  t += 60 * 60_000 + 1000;
  const ok = await handleOtpVerify(post({ phone: '+919999900021', token: '123456' }), deps);
  assertEquals(ok.status, 200);
  assertEquals((await ok.json()).session.access_token, 'x');
});

Deno.test('otp-verify: rejects malformed input', async () => {
  const store = fakeOtpStore(() => Date.now());
  const res = await handleOtpVerify(post({ phone: '12345', token: 'abc' }), {
    ...store,
    maxFailures: 5,
    verify: () => Promise.resolve({ ok: false, code: 'x' }),
  });
  assertEquals(res.status, 400);
});

Deno.test('msg91 request is built only when configured', () => {
  assertEquals(buildMsg91Request('919999900021', '123456', () => undefined), null);
  const env = (k: string) => ({ MSG91_AUTH_KEY: 'k', MSG91_TEMPLATE_ID: 't' } as Record<string, string>)[k];
  const req = buildMsg91Request('919999900021', '123456', env)!;
  assertEquals(req.url, 'https://control.msg91.com/api/v5/flow');
  const body = JSON.parse(req.init.body as string);
  assertEquals(body.recipients[0], { mobiles: '919999900021', otp: '123456' });
  assertEquals(body.template_id, 't');
});

Deno.test('webhook signatures round-trip', async () => {
  const secret = 'v1,whsec_' + btoa('a-very-secret-key-for-tests-12345');
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signWebhook(secret, 'msg_1', ts, '{"a":1}');
  const headers = new Headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': ts, 'webhook-signature': sig });
  assert(await verifyWebhook(secret, headers, '{"a":1}'));
  assert(!(await verifyWebhook(secret, headers, '{"a":2}')));
});

Deno.test('send-sms-hook: stub when MSG91 missing, 429 when blocked, sends when configured', async () => {
  const event = JSON.stringify({ user: { phone: '919999900021' }, sms: { otp: '123456' } });
  const logs: string[] = [];
  const stub = await handleSendSms(new Request('http://x', { method: 'POST', body: event }), {
    env: () => undefined,
    fetch: () => Promise.reject(new Error('should not call')),
    blockedUntil: () => Promise.resolve(null),
    log: (m) => logs.push(m),
  });
  assertEquals(stub.status, 200);
  assert(logs[0]!.includes('stub'));
  assert(!logs[0]!.includes('919999900021'), 'logs never contain the full phone number');

  const blocked = await handleSendSms(new Request('http://x', { method: 'POST', body: event }), {
    env: () => undefined,
    fetch,
    blockedUntil: () => Promise.resolve('2026-11-05T02:00:00Z'),
  });
  assertEquals(blocked.status, 429);

  let called = 0;
  const env = (k: string) => ({ MSG91_AUTH_KEY: 'k', MSG91_TEMPLATE_ID: 't' } as Record<string, string>)[k];
  const sent = await handleSendSms(new Request('http://x', { method: 'POST', body: event }), {
    env,
    fetch: () => {
      called++;
      return Promise.resolve(new Response('{}', { status: 200 }));
    },
    blockedUntil: () => Promise.resolve(null),
  });
  assertEquals(sent.status, 200);
  assertEquals(called, 1);
});

Deno.test('send-sms-hook: rejects bad signatures when a secret is set', async () => {
  const env = (k: string) => ({ SEND_SMS_HOOK_SECRET: 'v1,whsec_' + btoa('secret-secret-secret') } as Record<string, string>)[k];
  const res = await handleSendSms(new Request('http://x', { method: 'POST', body: '{}' }), {
    env,
    fetch,
    blockedUntil: () => Promise.resolve(null),
  });
  assertEquals(res.status, 401);
});
