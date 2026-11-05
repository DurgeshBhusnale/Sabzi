import type { AnalyticsEvent } from '@sabzi/shared';

export type Props = Record<string, string | number | boolean | null | undefined>;
type Sink = (event: AnalyticsEvent, props: Props) => void;

let sink: Sink = () => undefined;

export function setAnalyticsSink(s: Sink): void {
  sink = s;
}

const PERSONAL_KEY = /phone|name|email|address|text|note|token/i;
const PHONE_LIKE = /(\+?91)?[6-9]\d{9}/;

/** TECH_SPEC §10: properties never include phone numbers or names. Drops anything that could. */
export function sanitize(props: Props): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    if (PERSONAL_KEY.test(k)) continue;
    if (typeof v === 'string' && (PHONE_LIKE.test(v.replace(/\s/g, '')) || v.length > 64)) continue;
    out[k] = v;
  }
  return out;
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  try {
    sink(event, sanitize(props));
  } catch {
    // analytics must never break the app
  }
}
