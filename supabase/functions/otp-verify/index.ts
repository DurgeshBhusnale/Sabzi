import { createClient } from '@supabase/supabase-js';
import { handleOtpVerify } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve((req) =>
  handleOtpVerify(req, {
    maxFailures: 5,
    blockedUntil: async (phone) => ((await admin.rpc('otp_blocked_until', { p_phone: phone })).data as string | null) ?? null,
    recordFailure: async (phone) => ((await admin.rpc('otp_record_failure', { p_phone: phone })).data as string | null) ?? null,
    recordSuccess: async (phone) => {
      await admin.rpc('otp_record_success', { p_phone: phone });
    },
    failuresSoFar: async (phone) => {
      const { data } = await admin.from('otp_attempts').select('failures').eq('phone', phone.replace(/\D/g, '')).maybeSingle();
      return (data?.failures as number | undefined) ?? 0;
    },
    verify: async (phone, token) => {
      const res = await fetch(`${url}/auth/v1/verify`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token, type: 'sms' }),
      });
      const body = await res.json();
      if (res.ok) return { ok: true, session: body };
      return { ok: false, code: String(body?.error_code ?? 'otp_invalid') };
    },
  }),
);
