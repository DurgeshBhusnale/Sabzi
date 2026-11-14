// Shared test setup for the mobile app.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// Native modules without a JS fallback: in-memory fakes for tests.
jest.mock('expo-secure-store', () => {
  const m = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => m.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void m.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void m.delete(k)),
  };
});
jest.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    exists = true;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
    }
    create() {}
  }
  class File extends Directory {
    async copy() {}
    delete() {}
  }
  return { Directory, File, Paths: { document: { uri: 'file:///doc' }, cache: { uri: 'file:///cache' } } };
});
