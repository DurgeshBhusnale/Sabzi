import { createClient } from '@supabase/supabase-js';
import { denoEnv } from '../_shared/http.ts';
import { expoSender, handleNotify, type Context } from './handler.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve((req) =>
  handleNotify(req, {
    env: denoEnv,
    now: () => new Date(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: console.log,
    context: async (kind, ref) => {
      const { data, error } = await admin.rpc('notify_context', { p_kind: kind, p_ref: ref });
      if (error) throw error;
      return (data as Context | null) ?? null;
    },
    insertNotifications: async (rows) => {
      const { data, error } = await admin.from('notifications').insert(rows).select('id');
      if (error) throw error;
      return (data ?? []).map((r: { id: string }) => r.id);
    },
    sendExpo: expoSender(denoEnv),
  }),
);
