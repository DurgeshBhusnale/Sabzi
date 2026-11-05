import { createClient } from '@supabase/supabase-js';
import { denoEnv } from '../_shared/http.ts';
import { handleSendSms } from './handler.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve((req) =>
  handleSendSms(req, {
    env: denoEnv,
    fetch,
    log: console.log,
    blockedUntil: async (phone) => {
      const { data } = await admin.rpc('otp_blocked_until', { p_phone: phone });
      return (data as string | null) ?? null;
    },
  }),
);
