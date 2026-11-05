import { z } from 'zod';
import { corsHeaders, json } from '../_shared/http.ts';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(60),
  level: z.enum(['owner', 'field_staff']),
});

export type InviteDeps = {
  /** True when the bearer token belongs to an active owner with a 2-step session. */
  callerIsOwner: (authHeader: string) => Promise<boolean>;
  invite: (email: string) => Promise<{ userId: string } | { error: string }>;
  makeAdmin: (userId: string, level: 'owner' | 'field_staff', name: string) => Promise<void>;
};

/** A-10: owner invites a team member by email (service role stays inside this function). */
export async function handleInvite(req: Request, deps: InviteDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ') || !(await deps.callerIsOwner(auth))) return json({ error: 'owner_only' }, 403);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'invalid_input' }, 400);
  const r = await deps.invite(parsed.data.email);
  if ('error' in r) return json({ error: r.error }, 400);
  await deps.makeAdmin(r.userId, parsed.data.level, parsed.data.name);
  return json({ user_id: r.userId });
}
