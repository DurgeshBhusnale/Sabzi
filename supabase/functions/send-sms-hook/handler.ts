import { json, type Env } from '../_shared/http.ts';
import { buildMsg91Request } from '../_shared/msg91.ts';
import { verifyWebhook } from '../_shared/webhook.ts';

export type SendSmsDeps = {
  env: Env;
  fetch: typeof fetch;
  /** Returns the ISO time a number is blocked until, or null */
  blockedUntil: (phone: string) => Promise<string | null>;
  log?: (msg: string) => void;
};

type HookEvent = { user: { phone: string }; sms: { otp: string } };

/** Supabase Auth "Send SMS" HTTP hook → MSG91. Stubbed (logs only) when MSG91 secrets are missing. */
export async function handleSendSms(req: Request, deps: SendSmsDeps): Promise<Response> {
  const body = await req.text();
  const secret = deps.env('SEND_SMS_HOOK_SECRET');
  if (secret && !(await verifyWebhook(secret, req.headers, body))) {
    return json({ error: { http_code: 401, message: 'invalid signature' } }, 401);
  }
  let event: HookEvent;
  try {
    event = JSON.parse(body) as HookEvent;
  } catch {
    return json({ error: { http_code: 400, message: 'invalid payload' } }, 400);
  }
  const phone = event?.user?.phone;
  const otp = event?.sms?.otp;
  if (!phone || !otp) return json({ error: { http_code: 400, message: 'missing phone or otp' } }, 400);

  const until = await deps.blockedUntil(phone);
  if (until) return json({ error: { http_code: 429, message: `otp_blocked:${until}` } }, 429);

  const request = buildMsg91Request(phone, otp, deps.env);
  if (!request) {
    deps.log?.(`[send-sms-hook] MSG91 not configured; SMS to ••••${phone.slice(-4)} not sent (stub)`);
    return json({});
  }
  const res = await deps.fetch(request.url, request.init);
  if (!res.ok) {
    return json({ error: { http_code: 502, message: 'sms_provider_failed' } }, 502);
  }
  return json({});
}
