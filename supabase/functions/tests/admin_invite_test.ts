import { assertEquals } from '@std/assert';
import { handleInvite, type InviteDeps } from '../admin-invite/handler.ts';

const req = (body: unknown, auth = 'Bearer t') => new Request('http://x', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: auth } });
const deps = (owner: boolean, calls: string[] = []): InviteDeps => ({
  callerIsOwner: () => Promise.resolve(owner),
  invite: (email) => {
    calls.push(`invite:${email}`);
    return Promise.resolve({ userId: 'u1' });
  },
  makeAdmin: (id, level, name) => {
    calls.push(`admin:${id}:${level}:${name}`);
    return Promise.resolve();
  },
});

Deno.test('admin-invite: owner invites field staff', async () => {
  const calls: string[] = [];
  const res = await handleInvite(req({ email: 'Sachin@Example.com', name: 'Sachin', level: 'field_staff' }), deps(true, calls));
  assertEquals(res.status, 200);
  assertEquals(calls, ['invite:sachin@example.com', 'admin:u1:field_staff:Sachin']);
});

Deno.test('admin-invite: field staff and anonymous callers are refused', async () => {
  assertEquals((await handleInvite(req({ email: 'a@b.co', name: 'Ab', level: 'owner' }), deps(false))).status, 403);
  assertEquals((await handleInvite(req({ email: 'a@b.co', name: 'Ab', level: 'owner' }, ''), deps(true))).status, 403);
});

Deno.test('admin-invite: validates input', async () => {
  assertEquals((await handleInvite(req({ email: 'nope', name: 'A', level: 'boss' }), deps(true))).status, 400);
});
