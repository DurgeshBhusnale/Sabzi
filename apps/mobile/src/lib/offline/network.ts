import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export type Network = { online: boolean; weak: boolean };

export function toNetwork(s: Pick<NetInfoState, 'isConnected' | 'isInternetReachable' | 'type' | 'details'>): Network {
  const online = s.isConnected !== false && s.isInternetReachable !== false;
  const gen = s.type === 'cellular' ? (s.details as { cellularGeneration?: string | null } | null)?.cellularGeneration : null;
  return { online, weak: online && (gen === '2g' || gen === '3g') };
}

export function useNetwork(): Network {
  const [net, setNet] = useState<Network>({ online: true, weak: false });
  useEffect(() => NetInfo.addEventListener((s) => setNet(toNetwork(s))), []);
  return net;
}

/** fetch() failures on React Native surface as TypeError "Network request failed". */
export function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network request failed|failed to fetch|network|timeout|aborted/i.test(msg);
}
