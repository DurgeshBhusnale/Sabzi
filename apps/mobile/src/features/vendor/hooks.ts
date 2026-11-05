import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const vendorKeys = {
  me: ['vendor', 'me'] as const,
  usual: ['vendor', 'usual'] as const,
  items: ['vendor', 'items'] as const,
  today: ['vendor', 'menu', 'today'] as const,
  yesterday: ['vendor', 'menu', 'yesterday'] as const,
  stops: ['vendor', 'stops', 'today'] as const,
  week: ['vendor', 'stops', 'week'] as const,
  stats: ['vendor', 'stats'] as const,
  followers: ['vendor', 'followers'] as const,
  reviews: ['vendor', 'reviews'] as const,
};

export const useMyVendor = () => useQuery({ queryKey: vendorKeys.me, queryFn: () => api.getMyVendor() });
export const useUsualItems = () => useQuery({ queryKey: vendorKeys.usual, queryFn: () => api.getUsualItems() });
export const useAllItems = () => useQuery({ queryKey: vendorKeys.items, queryFn: () => api.listItems() });
export const useTodayMenu = () => useQuery({ queryKey: vendorKeys.today, queryFn: () => api.getMenu(api.todayIst()) });
export const useYesterdayMenu = () => useQuery({ queryKey: vendorKeys.yesterday, queryFn: () => api.getMenu(api.yesterdayIst()) });
export const useStopsToday = () => useQuery({ queryKey: vendorKeys.stops, queryFn: () => api.getStopsToday(), refetchInterval: 60_000 });
export const useStopsWeek = () => useQuery({ queryKey: vendorKeys.week, queryFn: () => api.getStopsWeek() });
export const useStats = () => useQuery({ queryKey: vendorKeys.stats, queryFn: () => api.getStats() });
export const useFollowerCounts = () => useQuery({ queryKey: vendorKeys.followers, queryFn: () => api.getFollowerCounts() });
export const useMyReviews = () => useQuery({ queryKey: vendorKeys.reviews, queryFn: () => api.getMyReviews() });

export function useInvalidateVendor() {
  const qc = useQueryClient();
  return (...keys: (readonly string[])[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}

export function useSoldOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, soldOut }: { itemId: string; soldOut: boolean }) => api.setSoldOut(itemId, soldOut),
    onMutate: async ({ itemId, soldOut }) => {
      await qc.cancelQueries({ queryKey: vendorKeys.today });
      const prev = qc.getQueryData<api.DayMenu | null>(vendorKeys.today);
      if (prev) qc.setQueryData(vendorKeys.today, { ...prev, lines: prev.lines.map((l) => (l.itemId === itemId ? { ...l, soldOut } : l)) });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(vendorKeys.today, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: vendorKeys.today }),
  });
}
