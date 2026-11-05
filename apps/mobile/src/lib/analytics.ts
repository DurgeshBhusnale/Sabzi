import type { AnalyticsEvent } from '@sabzi/shared';

type Props = Record<string, string | number | boolean | null | undefined>;
type Sink = (event: AnalyticsEvent, props: Props) => void;

let sink: Sink = () => undefined;

/** Analytics sink is wired to PostHog in M11. Never pass names or phone numbers. */
export function setAnalyticsSink(s: Sink): void {
  sink = s;
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  try {
    sink(event, props);
  } catch {
    // analytics must never break the app
  }
}
