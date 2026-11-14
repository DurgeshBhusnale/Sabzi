import { vendorCodeSchema, societyIdSchema } from '@sabzi/shared';
import { createSecureStorage } from '../src/lib/secureStorage';
import { compressUnder } from '../src/features/vendor/photos';
import { releaseKept, keepForUpload } from '../src/lib/keepFile';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async () => ({ uri: 'file:///cache/out.jpg' })),
  SaveFormat: { JPEG: 'jpeg' },
}));

function memStore() {
  const m = new Map<string, string>();
  return {
    m,
    getItemAsync: async (k: string) => m.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void m.set(k, v),
    deleteItemAsync: async (k: string) => void m.delete(k),
  };
}

describe('SEC-13: auth session in secure storage', () => {
  it('round-trips a long value in chunks and removes every chunk', async () => {
    const store = memStore();
    const legacy = { getItem: jest.fn(async () => null), removeItem: jest.fn(async () => undefined) };
    const s = createSecureStorage(store as never, legacy);
    const value = 'x'.repeat(5000);
    await s.setItem('sb-abc-auth-token', value);
    expect(await s.getItem('sb-abc-auth-token')).toBe(value);
    expect(store.m.get('sb-abc-auth-token.n')).toBe('3');
    await s.removeItem('sb-abc-auth-token');
    expect(store.m.size).toBe(0);
  });
  it('moves a session saved by an older build out of AsyncStorage, so nobody is logged out', async () => {
    const store = memStore();
    const legacy = { getItem: jest.fn(async () => '{"access_token":"a"}'), removeItem: jest.fn(async () => undefined) };
    const s = createSecureStorage(store as never, legacy);
    expect(await s.getItem('sb-abc-auth-token')).toBe('{"access_token":"a"}');
    expect(legacy.removeItem).toHaveBeenCalledWith('sb-abc-auth-token');
    expect(store.m.get('sb-abc-auth-token.0')).toBe('{"access_token":"a"}');
  });
});

describe('SEC-14: deep-link params', () => {
  it('accepts real vendor codes (any case) and rejects anything else', () => {
    expect(vendorCodeSchema.safeParse('RMSH4K7P').success).toBe(true);
    expect(vendorCodeSchema.parse(' rmsh4k7p ')).toBe('RMSH4K7P');
    for (const bad of ['', 'RMSH4K7', 'RMSH4K7PX', 'x/../account', 'RMSH0K7P', '%2Faccount']) expect(vendorCodeSchema.safeParse(bad).success).toBe(false);
  });
  it('society links need a UUID', () => {
    expect(societyIdSchema.safeParse('40000000-0000-4000-8000-000000000001').success).toBe(true);
    expect(societyIdSchema.safeParse('../account/delete').success).toBe(false);
  });
});

describe('TECH-11: compressor never returns an over-limit file', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });
  it('returns too_big when even the smallest step is over the limit', async () => {
    global.fetch = jest.fn(async () => ({ blob: async () => ({ size: 500_000 }) })) as never;
    expect(await compressUnder('file:///cache/in.jpg', 300 * 1024)).toEqual({ kind: 'too_big', bytes: 500_000 });
  });
  it('returns ok as soon as a step fits', async () => {
    global.fetch = jest.fn(async () => ({ blob: async () => ({ size: 200_000 }) })) as never;
    expect(await compressUnder('file:///cache/in.jpg', 300 * 1024)).toMatchObject({ kind: 'ok', bytes: 200_000 });
  });
});

describe('TECH-12: queued photos are kept outside the cache', () => {
  it('copies into the documents folder and releases only kept copies', async () => {
    const kept = await keepForUpload('file:///cache/out.jpg', '2026-11-15.jpg');
    expect(kept).toBe('file:///doc/pending-photos/2026-11-15.jpg');
    expect(() => releaseKept(kept)).not.toThrow();
    expect(() => releaseKept('file:///cache/out.jpg')).not.toThrow();
  });
});

describe('TECH-10: token refresh follows the app state', () => {
  it('starts auto-refresh when active and stops it in the background', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_test';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppState } = require('react-native') as typeof import('react-native');
    let listener: ((s: string) => void) | undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, l) => {
      listener = l as (s: string) => void;
      return { remove: () => undefined } as never;
    });
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabase } = require('../src/lib/supabase') as typeof import('../src/lib/supabase');
      const c = getSupabase();
      const start = jest.spyOn(c.auth, 'startAutoRefresh').mockResolvedValue(undefined);
      const stop = jest.spyOn(c.auth, 'stopAutoRefresh').mockResolvedValue(undefined);
      listener!('background');
      expect(stop).toHaveBeenCalled();
      listener!('active');
      expect(start).toHaveBeenCalled();
      stop.mockRestore();
    });
    spy.mockRestore();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });
});
