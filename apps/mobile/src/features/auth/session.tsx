import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase';
import { hasSeenOnboarding, markOnboardingSeen } from '../../lib/onboarding';
import { runSignOutCleanup } from '../../lib/signOutCleanup';
import { getMyAccount, nextAuthStep, type MyAccount } from './api';

/** TECH-04: last good account, used when my_account fails on a weak network at start. */
const ACCOUNT_KEY = 'sabzi.account.v1';

async function cachedAccount(userId: string): Promise<MyAccount | null> {
  try {
    const a = JSON.parse((await AsyncStorage.getItem(ACCOUNT_KEY)) ?? 'null') as MyAccount | null;
    return a?.user_id === userId ? a : null;
  } catch {
    return null;
  }
}

type SessionState = {
  /** 'error': signed in, but the account could not be loaded and nothing is cached (TECH-04) */
  status: 'loading' | 'signedOut' | 'signedIn' | 'error';
  session: Session | null;
  account: MyAccount | null;
  step: ReturnType<typeof nextAuthStep>;
  refresh: () => Promise<void>;
  /** Phone number typed on S-03, kept for "Edit" and session-expired prefill (X-07) */
  lastPhone: string;
  setLastPhone: (p: string) => void;
  /** TECH-02: the welcome slides were already passed on this device */
  onboardingSeen: boolean;
  markSeen: () => void;
};

const SessionContext = createContext<SessionState>({
  status: 'loading',
  session: null,
  account: null,
  step: 'phone',
  refresh: async () => undefined,
  lastPhone: '',
  setLastPhone: () => undefined,
  onboardingSeen: false,
  markSeen: () => undefined,
});

/** AUTH-5: the session is restored from storage and refreshed silently by supabase-js. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [status, setStatus] = useState<SessionState['status']>('loading');
  const [lastPhone, setLastPhone] = useState('');

  const [onboardingSeen, setOnboardingSeen] = useState(false);

  const lastUser = useRef<string | null>(null);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    // TECH-05: a session ended, or another account signed in on this device → drop the previous user's data.
    if (lastUser.current && lastUser.current !== (s?.user.id ?? null)) await runSignOutCleanup();
    lastUser.current = s?.user.id ?? null;
    if (!s) {
      setAccount(null);
      await AsyncStorage.removeItem(ACCOUNT_KEY).catch(() => undefined);
      setStatus('signedOut');
      return;
    }
    try {
      const acc = await getMyAccount();
      setAccount(acc);
      if (acc) await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc)).catch(() => undefined);
      setStatus('signedIn');
    } catch {
      // TECH-04: never treat a signed-in user as new because one request failed.
      const cached = await cachedAccount(s.user.id);
      setAccount(cached);
      setStatus(cached ? 'signedIn' : 'error');
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    Promise.all([hasSeenOnboarding(), sb.auth.getSession()]).then(([seen, { data }]) => {
      setOnboardingSeen(seen);
      return load(data.session);
    });
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      load(s);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    await load(data.session);
  }, [load]);

  const markSeen = useCallback(() => {
    setOnboardingSeen(true);
    markOnboardingSeen();
  }, []);

  const value = useMemo(
    () => ({ status, session, account, step: nextAuthStep(session ? account : null), refresh, lastPhone, setLastPhone, onboardingSeen, markSeen }),
    [status, session, account, refresh, lastPhone, onboardingSeen, markSeen],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}

/** Where a user goes on start. Signed-out users see the welcome slides only until they have passed them once. */
export function homeFor(step: ReturnType<typeof nextAuthStep>, onboardingSeen = false): string {
  const signedOutHome = onboardingSeen ? '/(auth)/signin' : '/(auth)/welcome';
  switch (step) {
    case 'phone':
      return signedOutHome;
    case 'role':
      return '/(auth)/role';
    case 'name':
      return '/(auth)/name';
    case 'vendor':
      return '/(vendor)/today';
    case 'admin':
      return signedOutHome;
    default:
      return '/(buyer)/home';
  }
}
