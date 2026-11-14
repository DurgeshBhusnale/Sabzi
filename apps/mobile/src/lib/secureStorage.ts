import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * SEC-13: Supabase auth storage in the Android Keystore (expo-secure-store) instead of plain AsyncStorage.
 * Values are split into chunks (SecureStore values should stay small). A session saved by an older build in
 * AsyncStorage is moved over on first read, so nobody is logged out by the update.
 */
const CHUNK = 1800;
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

type Store = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'>;

export function createSecureStorage(store: Store = SecureStore, legacy: Pick<typeof AsyncStorage, 'getItem' | 'removeItem'> = AsyncStorage) {
  async function read(key: string): Promise<string | null> {
    const k = safe(key);
    const n = Number(await store.getItemAsync(`${k}.n`));
    if (!n) return null;
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const part = await store.getItemAsync(`${k}.${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  }
  async function remove(key: string): Promise<void> {
    const k = safe(key);
    const n = Number(await store.getItemAsync(`${k}.n`)) || 0;
    for (let i = 0; i < n; i++) await store.deleteItemAsync(`${k}.${i}`);
    await store.deleteItemAsync(`${k}.n`);
  }
  async function write(key: string, value: string): Promise<void> {
    await remove(key);
    const k = safe(key);
    const n = Math.max(1, Math.ceil(value.length / CHUNK));
    for (let i = 0; i < n; i++) await store.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await store.setItemAsync(`${k}.n`, String(n));
  }
  return {
    async getItem(key: string): Promise<string | null> {
      const v = await read(key);
      if (v != null) return v;
      const old = await legacy.getItem(key).catch(() => null);
      if (old != null) {
        await write(key, old);
        await legacy.removeItem(key).catch(() => undefined);
      }
      return old;
    },
    setItem: write,
    async removeItem(key: string): Promise<void> {
      await remove(key);
      await legacy.removeItem(key).catch(() => undefined);
    },
  };
}
