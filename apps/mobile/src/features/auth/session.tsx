import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase';
import { getMyAccount, nextAuthStep, type MyAccount } from './api';

type SessionState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  session: Session | null;
  account: MyAccount | null;
  step: ReturnType<typeof nextAuthStep>;
  refresh: () => Promise<void>;
  /** Phone number typed on S-03, kept for "Edit" and session-expired prefill (X-07) */
  lastPhone: string;
  setLastPhone: (p: string) => void;
};

const SessionContext = createContext<SessionState>({
  status: 'loading',
  session: null,
  account: null,
  step: 'phone',
  refresh: async () => undefined,
  lastPhone: '',
  setLastPhone: () => undefined,
});

/** AUTH-5: the session is restored from storage and refreshed silently by supabase-js. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [status, setStatus] = useState<SessionState['status']>('loading');
  const [lastPhone, setLastPhone] = useState('');

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setAccount(null);
      setStatus('signedOut');
      return;
    }
    try {
      setAccount(await getMyAccount());
    } catch {
      setAccount(null);
    }
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => load(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      load(s);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    await load(data.session);
  }, [load]);

  const value = useMemo(
    () => ({ status, session, account, step: nextAuthStep(session ? account : null), refresh, lastPhone, setLastPhone }),
    [status, session, account, refresh, lastPhone],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}

export function homeFor(step: ReturnType<typeof nextAuthStep>): string {
  switch (step) {
    case 'phone':
      return '/(auth)/welcome';
    case 'role':
      return '/(auth)/role';
    case 'name':
      return '/(auth)/name';
    case 'vendor':
      return '/(vendor)/today';
    case 'admin':
      return '/(auth)/welcome';
    default:
      return '/(buyer)/home';
  }
}
