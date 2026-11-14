import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';
import { screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { setSupabaseForTests, type Client } from '../src/lib/supabase';
import { homeFor, SessionProvider, useSession } from '../src/features/auth/session';
import { onSignOut, runSignOutCleanup } from '../src/lib/signOutCleanup';
import { signOut } from '../src/features/auth/api';

function Probe() {
  const s = useSession();
  return <Text testID="probe">{`${s.status}|${s.step}|${s.account?.name ?? '-'}`}</Text>;
}

function fakeClient(rpcImpl: () => Promise<{ data: unknown; error: unknown }>, userId: string | null = 'u1') {
  return {
    rpc: jest.fn(rpcImpl),
    auth: {
      getSession: jest.fn(async () => ({ data: { session: userId ? { user: { id: userId } } : null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  } as unknown as Client;
}

const account = { user_id: 'u1', role: 'buyer', name: 'Priya', has_phone: true, phone_last4: '0011', email: null, email_verified: false, pending_email: null };

afterEach(async () => {
  setSupabaseForTests(null);
  await AsyncStorage.clear();
});

describe('TECH-02: signed-out start', () => {
  it('shows the slides only until they were passed once', () => {
    expect(homeFor('phone', false)).toBe('/(auth)/welcome');
    expect(homeFor('phone', true)).toBe('/(auth)/signin');
    expect(homeFor('admin', true)).toBe('/(auth)/signin');
    expect(homeFor('buyer', true)).toBe('/(buyer)/home');
  });
});

describe('TECH-04: account load fails at start', () => {
  it('uses the cached account instead of onboarding', async () => {
    await AsyncStorage.setItem('sabzi.account.v1', JSON.stringify(account));
    setSupabaseForTests(fakeClient(async () => ({ data: null, error: { message: 'Network request failed' } })));
    await renderUi(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId('probe').props.children).toBe('signedIn|buyer|Priya'));
  });
  it('reports an error (retry screen) when nothing is cached, never step "phone" while signed in', async () => {
    setSupabaseForTests(fakeClient(async () => ({ data: null, error: { message: 'Network request failed' } })));
    await renderUi(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId('probe').props.children).toMatch(/^error\|/));
  });
  it('caches the account after a good load', async () => {
    setSupabaseForTests(fakeClient(async () => ({ data: account, error: null })));
    await renderUi(<SessionProvider><Probe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId('probe').props.children).toBe('signedIn|buyer|Priya'));
    expect(JSON.parse((await AsyncStorage.getItem('sabzi.account.v1'))!).user_id).toBe('u1');
  });
});

describe('TECH-05: sign-out cleanup', () => {
  it('runs every registered cleanup and removes the user keys', async () => {
    await AsyncStorage.multiSet([['sabzi.queryCache.v1', '{}'], ['sabzi.actionQueue.v1', '[]'], ['sabzi.pendingRoute', '/v/X'], ['sabzi.themePref', 'dark']]);
    const a = jest.fn();
    const off = onSignOut(a);
    onSignOut(() => {
      throw new Error('boom');
    });
    await runSignOutCleanup();
    expect(a).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('sabzi.queryCache.v1')).toBeNull();
    expect(await AsyncStorage.getItem('sabzi.pendingRoute')).toBeNull();
    expect(await AsyncStorage.getItem('sabzi.themePref')).toBe('dark');
    off();
  });
  it('signOut clears the push token on the profile before ending the session', async () => {
    const order: string[] = [];
    const eq = jest.fn(async () => {
      order.push('token');
      return { error: null };
    });
    const update = jest.fn(() => ({ eq }));
    const c = {
      from: jest.fn(() => ({ update })),
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: 'u1' } } })),
        signOut: jest.fn(async () => {
          order.push('signOut');
          return { error: null };
        }),
      },
    } as unknown as Client;
    await signOut(c);
    expect(update).toHaveBeenCalledWith({ push_token: null });
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(order).toEqual(['token', 'signOut']);
  });
});
