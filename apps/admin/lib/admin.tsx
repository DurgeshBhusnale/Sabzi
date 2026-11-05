'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { sb, rpc } from './supabase';
import type { AdminLevel } from './nav';

export type AdminMe = { user_id: string; name: string | null; admin_level: AdminLevel; active: boolean; mfa_ok: boolean };
type State = { loading: boolean; me: AdminMe | null; refresh: () => Promise<void>; signOut: () => Promise<void> };

const Ctx = createContext<State>({ loading: true, me: null, refresh: async () => undefined, signOut: async () => undefined });

export function AdminProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const { data } = await sb().auth.getSession();
    if (!data.session) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      setMe(await rpc<AdminMe | null>('admin_me'));
    } catch {
      setMe(null);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the session once on mount
    refresh();
  }, [refresh]);
  const signOut = async () => {
    await sb().auth.signOut();
    setMe(null);
  };
  return <Ctx.Provider value={{ loading, me, refresh, signOut }}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);
