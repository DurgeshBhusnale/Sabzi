import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AUTH_METHODS } from '@sabzi/shared';
import { renderUi } from '../src/test/render';
import { nextAuthStep, signInWithGoogle } from '../src/features/auth/api';
import type { Client } from '../src/lib/supabase';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
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
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'sabzi://auth/callback?code=abc123' })) };
    expect(await signInWithGoogle(c, browser, 'sabzi://auth/callback')).toEqual({ ok: true });
    expect(c.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'sabzi://auth/callback', skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
    expect(browser.openAuthSessionAsync).toHaveBeenCalledWith('https://sb.local/auth/v1/authorize?provider=google', 'sabzi://auth/callback');
    expect(c.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc123');
  });
  it('reports a cancelled sign-in', async () => {
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })) };
    expect(await signInWithGoogle(fakeAuth(), browser, 'sabzi://auth/callback')).toEqual({ ok: false, code: 'cancelled' });
  });
  it('reports a failed exchange or a missing code', async () => {
    const browser = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'sabzi://auth/callback?error=access_denied' })) };
    expect(await signInWithGoogle(fakeAuth(), browser, 'x')).toEqual({ ok: false, code: 'google_failed' });
    const browser2 = { openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: 'sabzi://auth/callback?code=x' })) };
    const c = fakeAuth({ exchangeCodeForSession: jest.fn(async () => ({ data: null, error: { message: 'bad' } })) });
    expect(await signInWithGoogle(c, browser2, 'x')).toEqual({ ok: false, code: 'google_failed' });
  });
  it('phone OTP is hidden but kept', () => {
    expect(AUTH_METHODS).toEqual({ google: true, phoneOtp: false, emailOtp: false });
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
