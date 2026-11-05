import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { AnalyticsEvent } from '@sabzi/shared';
import { newClientId } from './ids';
import type { Props } from './analytics';

/**
 * Minimal PostHog sink over its HTTP batch API (no SDK, no autocapture, no screen recording).
 * The distinct id is a random per-install id, never the phone or user id. Disabled without a key.
 */
export function createPosthogSink(opts: { key: string | undefined; host?: string; fetchImpl?: typeof fetch; flushAt?: number }) {
  if (!opts.key) return null;
  const host = (opts.host ?? 'https://eu.i.posthog.com').replace(/\/$/, '');
  const fetchImpl = opts.fetchImpl ?? fetch;
  let distinctId: string | null = null;
  let queue: { event: string; properties: Props; timestamp: string }[] = [];
  const flushAt = opts.flushAt ?? 10;

  const getId = async () => {
    if (distinctId) return distinctId;
    distinctId = (await AsyncStorage.getItem('sabzi.analyticsId').catch(() => null)) ?? newClientId();
    AsyncStorage.setItem('sabzi.analyticsId', distinctId).catch(() => undefined);
    return distinctId;
  };

  const flush = async () => {
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];
    const id = await getId();
    await fetchImpl(`${host}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: opts.key, batch: batch.map((b) => ({ ...b, distinct_id: id })) }),
    }).catch(() => {
      queue = [...batch, ...queue].slice(-200); // keep for the next try, bounded
    });
  };

  const sink = (event: AnalyticsEvent, props: Props) => {
    queue.push({ event, properties: { ...props, app_version: Constants.expoConfig?.version ?? null, platform: Platform.OS, $lib: 'sabzi-http' }, timestamp: new Date().toISOString() });
    if (queue.length >= flushAt || event === 'app_opened') flush();
  };
  return { sink, flush };
}
