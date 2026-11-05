import { describe, expect, it } from 'vitest';
import { anonClient, phoneLogin } from './client.ts';

describe('M2 auth against local Supabase', () => {
  it('logs in with a test OTP and creates a profile with no role', async () => {
    const c = await phoneLogin('+919999900022');
    const { data: user } = await c.auth.getUser();
    expect(user.user?.phone).toBe('919999900022');
    const { data: profile } = await c.from('profiles').select('role, name').single();
    expect(profile?.role).toBeNull();
  });

  it('sets the role once and refuses a change', async () => {
    const c = await phoneLogin('+919999900023');
    const first = await c.rpc('set_role', { p_role: 'buyer' });
    expect(first.error).toBeNull();
    const second = await c.rpc('set_role', { p_role: 'vendor' });
    expect(second.error?.message).toBe('role_locked');
    await c.rpc('complete_profile', { p_name: 'Test Buyer' });
    const { data } = await c.rpc('my_account');
    expect(data).toMatchObject({ role: 'buyer', name: 'Test Buyer', phone_last4: '0023' });
  });

  it('wrong OTP is rejected', async () => {
    const c = anonClient();
    await c.auth.signInWithOtp({ phone: '+919999900024' });
    const { error } = await c.auth.verifyOtp({ phone: '+919999900024', token: '000000', type: 'sms' });
    expect(error).not.toBeNull();
  });

  it('email login is offered only for verified emails', async () => {
    const c = anonClient();
    const { data } = await c.rpc('email_login_available', { p_email: 'nobody@example.com' });
    expect(data).toBe(false);
  });

  it('existing seeded vendor logs in and sees his own vendor row', async () => {
    const c = await phoneLogin('+919999900001');
    const { data } = await c.from('vendors').select('display_name, status').single();
    expect(data).toEqual({ display_name: 'Ramesh Sabzi', status: 'verified' });
  });
});
