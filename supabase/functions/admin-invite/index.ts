import { createClient } from '@supabase/supabase-js';
import { handleInvite } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve((req) =>
  handleInvite(req, {
    callerIsOwner: async (authHeader) => {
      const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
      const { data } = await caller.rpc('is_owner');
      return data === true;
    },
    invite: async (email) => {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
      if (error || !data.user) return { error: error?.message ?? 'invite_failed' };
      return { userId: data.user.id };
    },
    makeAdmin: async (userId, level, name) => {
      const { error } = await admin.rpc('make_admin', { p_user_id: userId, p_level: level, p_name: name });
      if (error) throw error;
    },
  }),
);
