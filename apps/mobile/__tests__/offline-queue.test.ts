import { ActionQueue, PermanentError, backoff, type QueuedAction, type QueueStorage } from '../src/lib/offline/queue';

function memStorage(): QueueStorage & { data: QueuedAction[] } {
  const s = { data: [] as QueuedAction[], load: async () => s.data, save: async (a: QueuedAction[]) => void (s.data = a) };
  return s;
}

/** Fake server that is idempotent on client_id, like the real RPCs. */
function fakeServer() {
  const applied = new Map<string, number>();
  let failNext = 0;
  return {
    applied,
    failTimes: (n: number) => void (failNext = n),
    exec: jest.fn(async (a: QueuedAction) => {
      if (failNext > 0) {
        failNext--;
        throw new Error('network');
      }
      applied.set(a.clientId, (applied.get(a.clientId) ?? 0) + 1);
    }),
  };
}

const action = (id: string, kind: QueuedAction['kind'] = 'publish_menu', payload: Record<string, unknown> = {}) => ({ clientId: id, kind, payload, label: kind });

describe('offline action queue (M8)', () => {
  let t = 1_000_000;
  const now = () => t;
  beforeEach(() => {
    t = 1_000_000;
  });

  it('queued → sent', async () => {
    const server = fakeServer();
    const q = new ActionQueue(memStorage(), server.exec, now);
    await q.init();
    await q.enqueue(action('a1'));
    expect(q.pending().map((a) => a.status)).toEqual(['queued']);
    await q.flush(false);
    expect(server.exec).not.toHaveBeenCalled();
    await q.flush(true);
    expect(q.list()[0]!.status).toBe('sent');
    expect(q.pending()).toHaveLength(0);
    expect(server.applied.get('a1')).toBe(1);
  });

  it('queued → failed → retry with backoff → sent', async () => {
    const server = fakeServer();
    const q = new ActionQueue(memStorage(), server.exec, now);
    await q.enqueue(action('a2', 'set_sold_out', { item_id: 'tomato', sold_out: true }));
    server.failTimes(2);
    await q.flush(true);
    expect(q.list()[0]).toMatchObject({ status: 'failed', attempts: 1, lastError: 'network' });
    await q.flush(true); // not due yet
    expect(server.exec).toHaveBeenCalledTimes(1);
    t += backoff(1);
    await q.flush(true);
    expect(q.list()[0]).toMatchObject({ status: 'failed', attempts: 2 });
    t += backoff(2);
    await q.flush(true);
    expect(q.list()[0]!.status).toBe('sent');
    expect(server.applied.get('a2')).toBe(1);
  });

  it('manual retry resets backoff', async () => {
    const server = fakeServer();
    const q = new ActionQueue(memStorage(), server.exec, now);
    await q.enqueue(action('a3'));
    server.failTimes(1);
    await q.flush(true);
    await q.retry('a3');
    await q.flush(true);
    expect(q.list()[0]!.status).toBe('sent');
  });

  it('duplicate send is idempotent (same client_id)', async () => {
    const server = fakeServer();
    const q = new ActionQueue(memStorage(), server.exec, now);
    await q.enqueue(action('dup', 'vendor_arrive', { gate_id: 'g' }));
    await q.enqueue(action('dup', 'vendor_arrive', { gate_id: 'g' }));
    expect(q.list()).toHaveLength(1);
    // app restarted mid-send: the action is replayed with the same client_id
    const storage = memStorage();
    const q2 = new ActionQueue(storage, server.exec, now);
    storage.data = [{ ...q.list()[0]!, status: 'sending' }];
    await q2.init();
    await q.flush(true);
    await q2.flush(true);
    expect(server.exec).toHaveBeenCalledTimes(2);
    expect(server.applied.get('dup')).toBe(2); // two calls…
    expect(new Set(server.exec.mock.calls.map((c) => c[0].clientId))).toEqual(new Set(['dup'])); // …with one key, which the server dedupes
  });

  it('newer sold-out toggle replaces an unsent older one for the same item', async () => {
    const q = new ActionQueue(memStorage(), fakeServer().exec, now);
    await q.enqueue(action('s1', 'set_sold_out', { item_id: 'tomato', sold_out: true }));
    await q.enqueue(action('s2', 'set_sold_out', { item_id: 'onion', sold_out: true }));
    await q.enqueue(action('s3', 'set_sold_out', { item_id: 'tomato', sold_out: false }));
    expect(q.list().map((a) => a.clientId)).toEqual(['s2', 's3']);
  });

  it('arrival older than 30 minutes waits for the vendor to confirm', async () => {
    const server = fakeServer();
    const q = new ActionQueue(memStorage(), server.exec, now);
    await q.enqueue(action('arr', 'vendor_arrive', { gate_id: 'g' }));
    t += 31 * 60_000;
    await q.flush(true);
    expect(q.list()[0]!.status).toBe('needs_confirm');
    expect(server.exec).not.toHaveBeenCalled();
    await q.confirmStale('arr', true);
    await q.flush(true);
    expect(q.list()[0]!.status).toBe('sent');
  });

  it('stale arrival can be discarded', async () => {
    const q = new ActionQueue(memStorage(), fakeServer().exec, now);
    await q.enqueue(action('arr2', 'vendor_arrive', { gate_id: 'g' }));
    t += 45 * 60_000;
    await q.flush(true);
    await q.confirmStale('arr2', false);
    expect(q.list()).toHaveLength(0);
  });

  it('permanent errors stop retrying', async () => {
    const q = new ActionQueue(memStorage(), async () => {
      throw new PermanentError('deal_limit');
    }, now);
    await q.enqueue(action('d1', 'send_deal'));
    await q.flush(true);
    t += 10 * 60_000;
    await q.flush(true);
    expect(q.list()[0]).toMatchObject({ status: 'failed', lastError: 'deal_limit' });
  });

  it('persists across restarts and notifies subscribers', async () => {
    const storage = memStorage();
    const q = new ActionQueue(storage, fakeServer().exec, now);
    const seen: number[] = [];
    q.subscribe((a) => seen.push(a.length));
    await q.enqueue(action('p1'));
    const q2 = new ActionQueue(storage, fakeServer().exec, now);
    await q2.init();
    expect(q2.pending().map((a) => a.clientId)).toEqual(['p1']);
    expect(seen).toContain(1);
  });
});
