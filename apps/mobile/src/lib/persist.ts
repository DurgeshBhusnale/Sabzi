import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** TECH_SPEC §8: the read cache is persisted so screens show saved data offline (X-02). */
export const queryPersister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'sabzi.queryCache.v1', throttleTime: 2000 });
export const PERSIST_MAX_AGE = 24 * 3_600_000;
