import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sabzi.pendingRoute';

/** Remembers where to go after login (B-16 QR opened while logged out). */
export async function setPendingRoute(href: string): Promise<void> {
  await AsyncStorage.setItem(KEY, href).catch(() => undefined);
}

export async function takePendingRoute(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v) await AsyncStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
