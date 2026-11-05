import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ActionQueue, type ActionKind, type QueuedAction, type QueueStorage } from './queue';
import { executor } from './executor';
import { isNetworkError, useNetwork, type Network } from './network';
import { newClientId } from '../ids';

const KEY = 'sabzi.actionQueue.v1';
const storage: QueueStorage = {
  load: async () => {
    try {
      return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as QueuedAction[];
    } catch {
      return [];
    }
  },
  save: async (a) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(a)).catch(() => undefined);
  },
};

type Ctx = Network & {
  actions: QueuedAction[];
  pending: QueuedAction[];
  /**
   * Runs an action now when online; if offline (or the network fails) stores it with its client_id and
   * sends it later. Returns queued=true when it will go out later.
   */
  runOrQueue: <T>(kind: ActionKind, payload: Record<string, unknown>, label: string, direct: (clientId: string) => Promise<T>) => Promise<{ queued: true } | { queued: false; result: T }>;
  retry: (clientId: string) => Promise<void>;
  confirmStale: (clientId: string, send: boolean) => Promise<void>;
};

const OfflineContext = createContext<Ctx | null>(null);

export function OfflineProvider({ children, queue: injected }: { children: ReactNode; queue?: ActionQueue }) {
  const net = useNetwork();
  const qc = useQueryClient();
  const [queue] = useState(() => injected ?? new ActionQueue(storage, executor));
  const [actions, setActions] = useState<QueuedAction[]>([]);

  useEffect(() => {
    const unsub = queue.subscribe(setActions);
    queue.init().then(() => queue.prune());
    return () => {
      unsub();
    };
  }, [queue]);

  // Flush when we come online and every 10 s while something is waiting.
  useEffect(() => {
    if (!net.online) return;
    const run = () => queue.flush(true).then(() => qc.invalidateQueries({ queryKey: ['vendor'] }));
    run();
    const id = setInterval(() => {
      if (queue.pending().some((a) => a.status === 'queued' || a.status === 'failed')) run();
    }, 10_000);
    return () => clearInterval(id);
  }, [net.online, queue, qc]);

  const runOrQueue = useCallback<Ctx['runOrQueue']>(
    async (kind, payload, label, direct) => {
      const clientId = newClientId();
      if (net.online) {
        try {
          return { queued: false, result: await direct(clientId) };
        } catch (e) {
          if (!isNetworkError(e)) throw e;
        }
      }
      await queue.enqueue({ clientId, kind, payload, label });
      return { queued: true };
    },
    [net.online, queue],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...net,
      actions,
      pending: actions.filter((a) => a.status !== 'sent'),
      runOrQueue,
      retry: (id) => queue.retry(id).then(() => queue.flush(net.online)),
      confirmStale: (id, send) => queue.confirmStale(id, send).then(() => queue.flush(net.online)),
    }),
    [net, actions, runOrQueue, queue],
  );
  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

const fallback: Ctx = {
  online: true,
  weak: false,
  actions: [],
  pending: [],
  runOrQueue: async (_k, _p, _l, direct) => ({ queued: false, result: await direct(newClientId()) }),
  retry: async () => undefined,
  confirmStale: async () => undefined,
};

export function useOffline(): Ctx {
  return useContext(OfflineContext) ?? fallback;
}
