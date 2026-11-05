'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Tiny data hook for admin pages (no extra dependency). Reloads when `key` changes. */
export function useData<T>(load: () => Promise<T>, key: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  });
  const k = JSON.stringify(key);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loader.current());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- (re)load when the key changes
    reload();
  }, [reload, k]);
  return { data, error, loading, reload, setData };
}
