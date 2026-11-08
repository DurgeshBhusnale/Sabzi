import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { emailSchema, otpSchema, phoneLocalSchema, toE164, nameSchema } from '@sabzi/shared';
import { getSupabase, type Client } from '../../lib/supabase';
import { AppErrorException, raise } from '../../lib/errors';
import { en } from '../../i18n/en';

export type Role = 'buyer' | 'vendor';

export type OtpResult = { ok: true } | { ok: false; code: 'otp_blocked'; blockedUntil: string } | { ok: false; code: string };

// ---------------------------------------------------------------------------------------------
// Google sign-in (primary while SMS OTP waits for DLT registration). Supabase OAuth with PKCE:
// open Google in an auth session, come back to pheri://auth/callback?code=…, exchange the code.
// ---------------------------------------------------------------------------------------------

export type Browser = { openAuthSessionAsync: (url: string, redirect: string) => Promise<{ type: string; url?: string }> };

export const authRedirectUrl = () => Linking.createURL('auth/callback');

export type GoogleResult = { ok: true } | { ok: false; code: 'cancelled' | 'google_failed' | 'network' };

export async function signInWithGoogle(c: Client = getSupabase(), browser: Browser = WebBrowser, redirectTo: string = authRedirectUrl()): Promise<GoogleResult> {
  const { data, error } = await c.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data?.url) return { ok: false, code: 'network' };
  const res = await browser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success' || !res.url) return { ok: false, code: 'cancelled' };
  const params = new URL(res.url.replace(/#/, '?')).searchParams;
  const code = params.get('code');
  if (!code) return { ok: false, code: 'google_failed' };
  const ex = await c.auth.exchangeCodeForSession(code);
  if (ex.error) return { ok: false, code: 'google_failed' };
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Phone OTP (kept for later; hidden while AUTH_METHODS.phoneOtp is false — needs DLT for SMS).
// ---------------------------------------------------------------------------------------------

/** S-03: validate and send the SMS OTP. Checks the 1-hour block first (AUTH-2). */
export async function sendPhoneOtp(localNumber: string, c: Client = getSupabase()): Promise<OtpResult> {
  const parsed = phoneLocalSchema.safeParse(localNumber);
  if (!parsed.success) return { ok: false, code: 'invalid_phone' };
  const phone = toE164(parsed.data);
  const status = await c.rpc('otp_status', { p_phone: phone });
  const until = (status.data as { blocked_until: string | null } | null)?.blocked_until;
  if (until) return { ok: false, code: 'otp_blocked', blockedUntil: until };
  const { error } = await c.auth.signInWithOtp({ phone });
  if (error) {
    const m = /otp_blocked:(\S+)/.exec(error.message);
    if (m?.[1]) return { ok: false, code: 'otp_blocked', blockedUntil: m[1] };
    return { ok: false, code: error.status === 429 ? 'too_many_requests' : 'sms_failed' };
  }
  return { ok: true };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; code: 'otp_blocked'; blockedUntil: string }
  | { ok: false; code: 'otp_invalid' | 'otp_expired'; attemptsLeft?: number }
  | { ok: false; code: string };

/** S-04: verify through the otp-verify edge function (counts failures), then store the session. */
export async function verifyPhoneOtp(localNumber: string, token: string, c: Client = getSupabase()): Promise<VerifyResult> {
  if (!otpSchema.safeParse(token).success) return { ok: false, code: 'otp_invalid' };
  const phone = toE164(localNumber);
  const { data, error } = await c.functions.invoke('otp-verify', { body: { phone, token } });
  if (error) {
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    const body = (await ctx?.json?.().catch(() => null)) as
      | { error?: string; blocked_until?: string; attempts_left?: number }
      | null;
    if (body?.error === 'otp_blocked' && body.blocked_until) return { ok: false, code: 'otp_blocked', blockedUntil: body.blocked_until };
    if (body?.error === 'otp_expired') return { ok: false, code: 'otp_expired' };
    if (body?.error === 'otp_invalid') return { ok: false, code: 'otp_invalid', attemptsLeft: body.attempts_left };
    return { ok: false, code: 'network' };
  }
  const session = (data as { session?: { access_token: string; refresh_token: string } }).session;
  if (!session) return { ok: false, code: 'otp_invalid' };
  const set = await c.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  if (set.error) return { ok: false, code: 'network' };
  return { ok: true };
}

/** S-05: email OTP login only for an existing, verified email (AUTH-4). */
/**
 * Email sign-in / sign-up with a 6-digit code (no password). New emails get a new account, like Google.
 * `allowSignUp: false` restores the old S-05 rule (only emails already verified on an account).
 */
export async function sendEmailOtp(email: string, c: Client = getSupabase(), opts: { allowSignUp?: boolean } = {}): Promise<OtpResult> {
  const allowSignUp = opts.allowSignUp ?? true;
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, code: 'invalid_email' };
  if (!allowSignUp) {
    const avail = await c.rpc('email_login_available', { p_email: parsed.data });
    if (!avail.data) return { ok: false, code: 'email_not_linked' };
  }
  const { error } = await c.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: allowSignUp } });
  if (error) {
    if (error.status === 429 || /rate|seconds/i.test(error.message)) return { ok: false, code: 'too_many_requests' };
    return { ok: false, code: allowSignUp ? 'email_failed' : 'email_not_linked' };
  }
  return { ok: true };
}

export async function verifyEmailOtp(email: string, token: string, c: Client = getSupabase()): Promise<VerifyResult> {
  const { error } = await c.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
  if (error) return { ok: false, code: /expired/i.test(error.message) ? 'otp_expired' : 'otp_invalid' };
  return { ok: true };
}

/** S-11: add an email; a 6-digit code is sent to it. */
export async function addEmail(email: string, c: Client = getSupabase()): Promise<OtpResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, code: 'invalid_email' };
  const { error } = await c.auth.updateUser({ email: parsed.data });
  if (error) return { ok: false, code: /already/i.test(error.message) ? 'email_taken' : 'network' };
  return { ok: true };
}

export async function verifyEmailChange(email: string, token: string, c: Client = getSupabase()): Promise<VerifyResult> {
  const { error } = await c.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email_change' });
  if (error) return { ok: false, code: 'otp_invalid' };
  return { ok: true };
}

/** S-06: role is chosen once (AUTH-3). */
export async function setRole(role: Role, c: Client = getSupabase()): Promise<void> {
  const { error } = await c.rpc('set_role', { p_role: role });
  if (error) raise(error);
}

/** S-07 profile building: name + mobile number (stored without SMS verification for now). */
export async function completeProfileWithPhone(name: string, localPhone: string, c: Client = getSupabase()): Promise<void> {
  const n = nameSchema.safeParse(name);
  if (!n.success) throw new AppErrorException({ code: 'invalid_name', message: en.errors.invalid_name });
  const p = phoneLocalSchema.safeParse(localPhone.replace(/\D/g, '').slice(-10));
  if (!p.success) throw new AppErrorException({ code: 'invalid_phone', message: en.errors.invalid_phone });
  const { error } = await c.rpc('complete_profile_with_phone', { p_name: n.data, p_phone: toE164(p.data) });
  if (error) raise(error);
}

export async function setMyPhone(localPhone: string, c: Client = getSupabase()): Promise<void> {
  const p = phoneLocalSchema.safeParse(localPhone.replace(/\D/g, '').slice(-10));
  if (!p.success) throw new AppErrorException({ code: 'invalid_phone', message: en.errors.invalid_phone });
  const { error } = await c.rpc('set_my_phone', { p_phone: toE164(p.data) });
  if (error) raise(error);
}

/** S-07 (name only; used by the phone-OTP flow where the number is already verified) */
export async function completeProfile(name: string, c: Client = getSupabase()): Promise<void> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) throw new AppErrorException({ code: 'invalid_name', message: en.errors.invalid_name });
  const { error } = await c.rpc('complete_profile', { p_name: parsed.data });
  if (error) raise(error);
}

export async function savePushToken(token: string, c: Client = getSupabase()): Promise<void> {
  const { error } = await c.rpc('save_push_token', { p_token: token });
  if (error) raise(error);
}

export type MyAccount = {
  user_id: string;
  role: Role | 'admin' | null;
  name: string | null;
  phone_last4: string | null;
  /** A mobile number is on file (verified by OTP in future, or given in the profile now) */
  has_phone?: boolean;
  provider?: 'google' | 'phone' | 'email' | string;
  email: string | null;
  email_verified: boolean;
  pending_email: string | null;
};

export async function getMyAccount(c: Client = getSupabase()): Promise<MyAccount | null> {
  const { data, error } = await c.rpc('my_account');
  if (error) raise(error);
  return (data as unknown as MyAccount | null) ?? null;
}

/** S-16 (AUTH-6) */
export async function deleteAccount(c: Client = getSupabase()): Promise<void> {
  const { error } = await c.rpc('delete_my_account');
  if (error) raise(error);
  await c.auth.signOut({ scope: 'local' });
}

/** S-15 */
export async function signOut(c: Client = getSupabase()): Promise<void> {
  await c.auth.signOut({ scope: 'local' });
}

/** Where to send a signed-in user next (S-06 → S-07 → role home) */
export function nextAuthStep(acc: MyAccount | null): 'phone' | 'role' | 'name' | 'buyer' | 'vendor' | 'admin' {
  if (!acc) return 'phone';
  if (!acc.role) return 'role';
  // Profile building needs a name and a mobile number (buyers and vendors alike).
  if (!acc.name || acc.has_phone === false) return 'name';
  return acc.role;
}
