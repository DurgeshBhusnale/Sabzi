import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import * as api from './api';

export const buyerKeys = {
  societies: ['buyer', 'societies'] as const,
  mine: ['buyer', 'my-societies'] as const,
  home: (id: string | null | undefined) => ['buyer', 'home', id] as const,
  vendor: (id: string, soc: string | null | undefined) => ['buyer', 'vendor', id, soc] as const,
  following: ['buyer', 'following'] as const,
  notifications: ['buyer', 'notifications'] as const,
};

export const useSocieties = () => useQuery({ queryKey: buyerKeys.societies, queryFn: () => api.listSocieties(), staleTime: 3_600_000 });
export const useMySocieties = () => useQuery({ queryKey: buyerKeys.mine, queryFn: () => api.mySocieties() });
export const useBuyerHome = (societyId: string | null | undefined) =>
  useQuery({ queryKey: buyerKeys.home(societyId), queryFn: () => api.buyerHome(societyId!), enabled: !!societyId, refetchInterval: 120_000 });
export const useVendorPage = (vendorId: string, societyId: string | null | undefined) =>
  useQuery({ queryKey: buyerKeys.vendor(vendorId, societyId), queryFn: () => api.vendorPage(vendorId, societyId ?? null) });
export const useFollowing = () => useQuery({ queryKey: buyerKeys.following, queryFn: () => api.myFollowing() });
export const useNotifications = () => useQuery({ queryKey: buyerKeys.notifications, queryFn: () => api.myNotifications() });

/**
 * Live status: any new stop_events row refetches home/vendor/following within a second or two (Supabase Realtime).
 * RLS limits the rows each buyer receives.
 */
export function useLiveStopEvents(enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const sb = getSupabase();
    const ch = sb
      .channel('stop-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stop_events' }, () => {
        qc.invalidateQueries({ queryKey: ['buyer'] });
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [enabled, qc]);
}

export function usePrimarySociety() {
  const mine = useMySocieties();
  const primary = mine.data?.find((s) => s.is_primary) ?? mine.data?.[0] ?? null;
  return { ...mine, primary };
}
