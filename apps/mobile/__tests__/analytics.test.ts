import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ANALYTICS_EVENTS } from '@sabzi/shared';
import { sanitize, setAnalyticsSink, track } from '../src/lib/analytics';
import { createPosthogSink } from '../src/lib/posthog';

const root = join(__dirname, '..');
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === 'node_modules' || f.startsWith('.') || f === '__tests__') return [];
    return statSync(p).isDirectory() ? sources(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

describe('M11: event names match TECH_SPEC §10 exactly', () => {
  it('the shared list equals the spec list', () => {
    const spec = readFileSync(join(root, '../../docs/TECH_SPEC.md'), 'utf8');
    const line = spec.split('\n').find((l) => l.startsWith('`signup_completed`'))!;
    const fromSpec = [...line.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
    expect([...ANALYTICS_EVENTS]).toEqual(fromSpec);
  });
  it('every event is fired somewhere in the app, and nothing else is', () => {
    const code = [...sources(join(root, 'app')), ...sources(join(root, 'src'))].map((f) => readFileSync(f, 'utf8')).join('\n');
    const fired = new Set([...code.matchAll(/track\('([a-z_]+)'/g)].map((m) => m[1]));
    for (const e of ANALYTICS_EVENTS) expect([e, fired.has(e)]).toEqual([e, true]);
    for (const e of fired) expect(ANALYTICS_EVENTS as readonly string[]).toContain(e);
  });
});

describe('no personal data in event properties', () => {
  it('drops names, phones, emails and free text', () => {
    expect(sanitize({ role: 'buyer', name: 'Priya', phone: '+919999900011', vendor_name: 'Ramesh', note: 'hi', items: 12, ref: '9876543210', ok: true })).toEqual({ role: 'buyer', items: 12, ok: true });
  });
  it('track sanitises before the sink sees it', () => {
    const seen: unknown[] = [];
    setAnalyticsSink((e, p) => seen.push([e, p]));
    track('vendor_followed', { society_name: 'Green Park', count: 1 });
    expect(seen).toEqual([['vendor_followed', { count: 1 }]]);
    setAnalyticsSink(() => undefined);
  });
});

describe('PostHog HTTP sink', () => {
  it('is disabled without a key', () => {
    expect(createPosthogSink({ key: undefined })).toBeNull();
  });
  it('batches events with an anonymous install id', async () => {
    const calls: { url: string; body: { api_key: string; batch: { event: string; distinct_id: string; properties: Record<string, unknown> }[] } }[] = [];
    const ph = createPosthogSink({ key: 'phc_test', flushAt: 2, fetchImpl: (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return new Response('{}');
    }) as never })!;
    ph.sink('vendor_page_viewed', {});
    ph.sink('menu_published', { items: 12 });
    await new Promise((r) => setTimeout(r, 10));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://eu.i.posthog.com/batch/');
    expect(calls[0]!.body.api_key).toBe('phc_test');
    expect(calls[0]!.body.batch.map((b) => b.event)).toEqual(['vendor_page_viewed', 'menu_published']);
    expect(calls[0]!.body.batch[0]!.distinct_id).toMatch(/[0-9a-f-]{36}/);
  });
});
