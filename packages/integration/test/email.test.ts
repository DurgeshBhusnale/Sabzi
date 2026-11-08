import { describe, expect, it } from 'vitest';
import { anonClient } from './client.ts';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

async function latestCode(to: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const list = (await r.json()) as { messages?: { ID: string }[] };
    const id = list.messages?.[0]?.ID;
    if (id) {
      const m = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as { Text: string; HTML: string };
      const code = /\b(\d{6})\b/.exec(`${m.Text} ${m.HTML}`)?.[1];
      if (code) return code;
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`no code mailed to ${to}`);
}

/** Email sign-up and sign-in with a 6-digit code (no password), then profile building. */
describe('email sign-in / sign-up', () => {
  it('a new email gets an account, a code by email, and goes to profile building', async () => {
    const email = `buyer-${Date.now()}@example.com`;
    const c = anonClient();
    const sent = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    expect(sent.error).toBeNull();
    const code = await latestCode(email);
    const v = await c.auth.verifyOtp({ email, token: code, type: 'email' });
    expect(v.error).toBeNull();
    const acc = (await c.rpc('my_account')).data as { role: string | null; has_phone: boolean; provider: string; email: string };
    expect(acc).toMatchObject({ role: null, has_phone: false, provider: 'email', email });
    expect((await c.rpc('set_role', { p_role: 'buyer' })).error).toBeNull();
    expect((await c.rpc('complete_profile_with_phone', { p_name: 'Email Buyer', p_phone: '+919812345678' })).error).toBeNull();
    const after = (await c.rpc('my_account')).data as { has_phone: boolean; phone_last4: string; name: string };
    expect(after).toMatchObject({ has_phone: true, phone_last4: '5678', name: 'Email Buyer' });
  });

  it('a wrong code is refused', async () => {
    const email = `wrong-${Date.now()}@example.com`;
    const c = anonClient();
    await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    const v = await c.auth.verifyOtp({ email, token: '000000', type: 'email' });
    expect(v.error).not.toBeNull();
  });
});
