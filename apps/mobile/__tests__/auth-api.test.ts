import {
  completeProfile,
  nextAuthStep,
  sendEmailOtp,
  sendPhoneOtp,
  setRole,
  verifyPhoneOtp,
} from '../src/features/auth/api';
import type { Client } from '../src/lib/supabase';
import { AppErrorException } from '../src/lib/errors';

function fakeClient(over: Record<string, unknown> = {}) {
  const rpc = jest.fn(async (name: string) => ({ data: name === 'otp_status' ? { blocked_until: null } : true, error: null }));
  const c = {
    rpc,
    auth: {
      signInWithOtp: jest.fn(async () => ({ error: null })),
      setSession: jest.fn(async () => ({ error: null })),
      verifyOtp: jest.fn(async () => ({ error: null })),
      signOut: jest.fn(async () => ({ error: null })),
    },
    functions: { invoke: jest.fn(async () => ({ data: { session: { access_token: 'a', refresh_token: 'r' } }, error: null })) },
    ...over,
  };
  return c as unknown as Client & typeof c;
}

describe('auth api', () => {
  it('rejects invalid phone numbers without calling the server', async () => {
    const c = fakeClient();
    expect(await sendPhoneOtp('12345', c)).toEqual({ ok: false, code: 'invalid_phone' });
    expect(c.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('sends an OTP to +91 numbers', async () => {
    const c = fakeClient();
    expect(await sendPhoneOtp('9999900021', c)).toEqual({ ok: true });
    expect(c.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+919999900021' });
  });

  it('shows the block before sending when the number is blocked', async () => {
    const c = fakeClient();
    c.rpc.mockResolvedValueOnce({ data: { blocked_until: '2026-11-05T02:00:00Z' }, error: null } as never);
    expect(await sendPhoneOtp('9999900021', c)).toEqual({ ok: false, code: 'otp_blocked', blockedUntil: '2026-11-05T02:00:00Z' });
  });

  it('verifies via the edge function and stores the session', async () => {
    const c = fakeClient();
    expect(await verifyPhoneOtp('9999900021', '123456', c)).toEqual({ ok: true });
    expect(c.functions.invoke).toHaveBeenCalledWith('otp-verify', { body: { phone: '+919999900021', token: '123456' } });
    expect(c.auth.setSession).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'r' });
  });

  it('reports attempts left on a wrong code', async () => {
    const c = fakeClient();
    c.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { context: { json: async () => ({ error: 'otp_invalid', attempts_left: 3 }) } },
    } as never);
    expect(await verifyPhoneOtp('9999900021', '000000', c)).toEqual({ ok: false, code: 'otp_invalid', attemptsLeft: 3 });
  });

  it('reports a block after too many wrong codes', async () => {
    const c = fakeClient();
    c.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { context: { json: async () => ({ error: 'otp_blocked', blocked_until: 'T' }) } },
    } as never);
    expect(await verifyPhoneOtp('9999900021', '000000', c)).toEqual({ ok: false, code: 'otp_blocked', blockedUntil: 'T' });
  });

  it('email login only for linked emails', async () => {
    const c = fakeClient();
    c.rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await sendEmailOtp('priya@example.com', c)).toEqual({ ok: false, code: 'email_not_linked' });
    expect(await sendEmailOtp('not-an-email', c)).toEqual({ ok: false, code: 'invalid_email' });
  });

  it('maps role_locked to friendly copy', async () => {
    const c = fakeClient();
    c.rpc.mockResolvedValueOnce({ data: null, error: { message: 'role_locked' } } as never);
    await expect(setRole('vendor', c)).rejects.toBeInstanceOf(AppErrorException);
  });

  it('validates names', async () => {
    await expect(completeProfile('A', fakeClient())).rejects.toThrow('Enter your name');
  });

  it('routes to the next step', () => {
    expect(nextAuthStep(null)).toBe('phone');
    const base = { user_id: 'u', phone_last4: '0021', email: null, email_verified: false, pending_email: null };
    expect(nextAuthStep({ ...base, role: null, name: null })).toBe('role');
    expect(nextAuthStep({ ...base, role: 'buyer', name: null })).toBe('name');
    expect(nextAuthStep({ ...base, role: 'vendor', name: 'Ramesh' })).toBe('vendor');
  });
});
