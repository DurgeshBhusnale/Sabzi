import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TECH-05: device data that belongs to the signed-in user. Providers register a cleanup (query cache, offline
 * queue); SessionProvider runs them all when a session ends (log out, delete, expiry).
 */
const cleanups = new Set<() => unknown>();

export const USER_STORAGE_KEYS = ['sabzi.queryCache.v1', 'sabzi.actionQueue.v1', 'sabzi.pendingRoute', 'sabzi.account.v1'];

export function onSignOut(fn: () => unknown): () => void {
  cleanups.add(fn);
  return () => {
    cleanups.delete(fn);
  };
}

export async function runSignOutCleanup(): Promise<void> {
  for (const fn of [...cleanups]) {
    try {
      await fn();
    } catch {
      // one failing cleanup must not keep the rest of the old user's data
    }
  }
  await AsyncStorage.multiRemove(USER_STORAGE_KEYS).catch(() => undefined);
}
