import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUTH_METHODS, LIMITS } from '@sabzi/shared';
import { renderUi } from '../src/test/render';
import { nextAuthStep, sendEmailOtp, signInWithGoogle } from '../src/features/auth/api';
import type { Client } from '../src/lib/supabase';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (cb: () => void | (() => void)) => require('react').useEffect(cb, [cb]),
}));
const mockComplete = jest.fn();
jest.mock('../src/features/auth/session', () => ({
  useSession: () => ({ refresh: jest.fn(), account: { role: 'buyer', name: 'Riya Patil', has_phone: false } }),
}));
jest.mock('../src/features/auth/api', () => ({
  ...jest.requireActual('../src/features/auth/api'),
  completeProfileWithPhone: (...a: unknown[]) => mockComplete(...a),
}));
// eslint-disable-next-line import/first
import SignIn from '../app/(auth)/signin';
// eslint-disable-next-line import/first
import ProfileStep from '../app/(auth)/name';
// eslint-disable-next-line import/first
import EmailLogin from '../app/(auth)/email';

function fakeAuth(over: Record<string, unknown> = {}) {
  const auth = {
    signInWithOAuth: jest.fn(async () => ({ data: { url: 'https://sb.local/auth/v1/authorize?provider=google' }, error: null })),
    exchangeCodeForSession: jest.fn(async () => ({ data: {}, error: null })),
    ...over,
  };
  return { auth } as unknown as Client & { auth: typeof auth };
}

describe('Google sign-in (Supabase OAuth, PKCE)', () => {
  it('opens Google, returns to the app and exchanges the code', async () => {
    const c = fakeAuth();
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'pheri://auth/callback?code=abc123' })) };
    expect(await signInWithGoogle(c, browser, 'pheri://auth/callback')).toEqual({ ok: true });
    expect(c.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'pheri://auth/callback', skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
    expect(browser.openAuthSessionAsync).toHaveBeenCalledWith('https://sb.local/auth/v1/authorize?provider=google', 'pheri://auth/callback');
    expect(c.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc123');
  });
  it('reports a cancelled sign-in', async () => {
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })) };
    expect(await signInWithGoogle(fakeAuth(), browser, 'pheri://auth/callback')).toEqual({ ok: false, code: 'cancelled' });
  });
  it('reports a failed exchange or a missing code', async () => {
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'pheri://auth/callback?error=access_denied' })) };
    expect(await signInWithGoogle(fakeAuth(), browser, 'x')).toEqual({ ok: false, code: 'google_failed' });
    const browser2 = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'pheri://auth/callback?code=x' })) };
    const c = fakeAuth({ exchangeCodeForSession: jest.fn(async () => ({ data: null, error: { message: 'bad' } })) });
    expect(await signInWithGoogle(c, browser2, 'x')).toEqual({ ok: false, code: 'google_failed' });
  });
  it('phone OTP is hidden but kept; email is on', () => {
    expect(AUTH_METHODS).toEqual({ google: true, phoneOtp: false, emailOtp: true });
  });
  it('asks for profile building until name and number are on file', () => {
    const base = { user_id: 'u', phone_last4: null, email: 'riya@example.com', email_verified: true, pending_email: null };
    expect(nextAuthStep({ ...base, role: 'buyer', name: 'Riya', has_phone: false })).toBe('name');
    expect(nextAuthStep({ ...base, role: 'buyer', name: 'Riya', has_phone: true, phone_last4: '3210' })).toBe('buyer');
  });
});

describe('sign-in screen', () => {
  it('needs consent, then shows Google errors', async () => {
    const google = jest.fn(async () => ({ ok: false as const, code: 'cancelled' as const }));
    await renderUi(<SignIn google={google} />);
    expect(screen.getByTestId('google-signin').props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText('Enter your mobile number')).toBeNull();
    await fireEvent.press(screen.getByTestId('consent'));
    await fireEvent.press(screen.getByTestId('google-signin'));
    await waitFor(() => expect(screen.getByTestId('signin-error')).toBeTruthy());
    expect(screen.getByText('Sign-in was cancelled. Try again when you are ready.')).toBeTruthy();
  });
});

describe('profile building (name + mobile number)', () => {
  it('prefills the Google name and needs a valid 10-digit number', async () => {
    mockComplete.mockResolvedValue(undefined);
    await renderUi(<ProfileStep />);
    expect(screen.getByTestId('name-input').props.value).toBe('Riya Patil');
    expect(screen.getByTestId('name-continue').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('mobile-input'), '1234567890');
    expect(screen.getByText('Enter a 10-digit mobile number')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('mobile-input'), '98765 43210');
    await fireEvent.press(screen.getByTestId('name-continue'));
    await waitFor(() => expect(mockComplete).toHaveBeenCalledWith('Riya Patil', '9876543210'));
  });
});

describe('email sign-in / sign-up', () => {
  it('sign-up is allowed: new emails get an account', async () => {
    const signInWithOtp = jest.fn(async () => ({ error: null }));
    const c = { rpc: jest.fn(), auth: { signInWithOtp } } as unknown as Client;
    expect(await sendEmailOtp(' Riya@Example.com ', c)).toEqual({ ok: true });
    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'riya@example.com', options: { shouldCreateUser: true } });
    expect((c as unknown as { rpc: jest.Mock }).rpc).not.toHaveBeenCalled();
  });
  it('rate limits and bad emails are reported', async () => {
    const c = { rpc: jest.fn(), auth: { signInWithOtp: jest.fn(async () => ({ error: { status: 429, message: 'rate limit' } })) } } as unknown as Client;
    expect(await sendEmailOtp('a@b.co', c)).toEqual({ ok: false, code: 'too_many_requests' });
    expect(await sendEmailOtp('nope', c)).toEqual({ ok: false, code: 'invalid_email' });
  });
  it('screen: email → code → signed in; wrong code shows an error', async () => {
    const send = jest.fn(async () => ({ ok: true as const }));
    const verify = jest.fn(async (_e: string, code: string) => (code === '123456' ? { ok: true as const } : { ok: false as const, code: 'otp_invalid' as const }));
    await renderUi(<EmailLogin send={send} verify={verify} />);
    expect(screen.getByTestId('send-email-code').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('email-input'), 'riya@example.com');
    await fireEvent.press(screen.getByTestId('send-email-code'));
    await waitFor(() => expect(screen.getByText('We sent a 6-digit code to riya@example.com')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('email-otp'), '000000');
    await waitFor(() => expect(screen.getByText("That code doesn't match. Check your email and try again.")).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('email-otp'), '123456');
    await waitFor(() => expect(verify).toHaveBeenLastCalledWith('riya@example.com', '123456'));
  });
  it('TECH-01: the whole code is sent, whatever the configured length (8 digits does not stop at 6)', async () => {
    const send = jest.fn(async () => ({ ok: true as const }));
    const verify = jest.fn(async () => ({ ok: true as const }));
    await renderUi(<EmailLogin send={send} verify={verify} codeLength={8} />);
    await fireEvent.changeText(screen.getByTestId('email-input'), 'riya@example.com');
    await fireEvent.press(screen.getByTestId('send-email-code'));
    await waitFor(() => expect(screen.getByTestId('email-otp-box-7')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('email-otp'), '123456');
    expect(verify).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('email-otp'), '12345678');
    await waitFor(() => expect(verify).toHaveBeenLastCalledWith('riya@example.com', '12345678'));
  });
  it('TECH-02: hardware back on the code step returns to the email field', async () => {
    const handlers: ((e: never) => boolean | null | undefined)[] = [];
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, h) => {
      handlers.push(h);
      return { remove: () => undefined };
    });
    const send = jest.fn(async () => ({ ok: true as const }));
    await renderUi(<EmailLogin send={send} verify={jest.fn()} />);
    await fireEvent.changeText(screen.getByTestId('email-input'), 'riya@example.com');
    await fireEvent.press(screen.getByTestId('send-email-code'));
    await waitFor(() => expect(screen.getByTestId('email-otp')).toBeTruthy());
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handlers[handlers.length - 1]!({} as never);
    });
    expect(handled).toBe(true);
    spy.mockRestore();
    await waitFor(() => expect(screen.getByTestId('email-input').props.value).toBe('riya@example.com'));
  });
  it('TECH-01: LIMITS.emailOtpLength matches supabase/config.toml otp_length', () => {
    const toml = readFileSync(join(__dirname, '../../../supabase/config.toml'), 'utf8');
    const section = toml.slice(toml.indexOf('[auth.email]'));
    const m = /^otp_length\s*=\s*(\d+)/m.exec(section);
    expect(Number(m?.[1])).toBe(LIMITS.emailOtpLength);
  });
  it('sign-in screen offers Google and email, both behind consent', async () => {
    await renderUi(<SignIn google={jest.fn()} />);
    expect(screen.getByTestId('email-signin').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('consent'));
    expect(screen.getByTestId('email-signin').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });
});
