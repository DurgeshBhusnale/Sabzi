import { z } from 'zod';
import { corsHeaders, json } from '../_shared/http.ts';

const bodySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  token: z.string().regex(/^\d{6}$/),
});

export type OtpVerifyDeps = {
  blockedUntil: (phone: string) => Promise<string | null>;
  recordFailure: (phone: string) => Promise<string | null>;
  recordSuccess: (phone: string) => Promise<void>;
  /** Calls GoTrue /verify; returns the session JSON or null on a wrong/expired code */
  verify: (phone: string, token: string) => Promise<{ ok: true; session: unknown } | { ok: false; code: string }>;
  maxFailures: number;
  failuresSoFar: (phone: string) => Promise<number>;
};

/**
 * AUTH-2: verify a phone OTP and block the number for 1 hour after 5 wrong codes.
 * The app calls this instead of supabase.auth.verifyOtp, then stores the returned session.
 */
export async function handleOtpVerify(req: Request, deps: OtpVerifyDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'invalid_input' }, 400);
  const { phone, token } = parsed.data;

  const blocked = await deps.blockedUntil(phone);
  if (blocked) return json({ error: 'otp_blocked', blocked_until: blocked }, 429);

  const result = await deps.verify(phone, token);
  if (result.ok) {
    await deps.recordSuccess(phone);
    return json({ session: result.session });
  }
  const until = await deps.recordFailure(phone);
  if (until) return json({ error: 'otp_blocked', blocked_until: until }, 429);
  const failures = await deps.failuresSoFar(phone);
  return json(
    { error: result.code === 'otp_expired' ? 'otp_expired' : 'otp_invalid', attempts_left: Math.max(0, deps.maxFailures - failures) },
    400,
  );
}
