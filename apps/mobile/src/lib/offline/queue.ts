import { LIMITS } from '@sabzi/shared';

/**
 * Vendor offline action queue (TECH_SPEC §8, X-04).
 * Each action gets its client_id at tap time; the server RPCs are idempotent on it, so retries and
 * duplicate sends are safe. Persisted so it survives an app restart.
 */
export type ActionKind = 'publish_menu' | 'set_sold_out' | 'vendor_arrive' | 'vendor_leaving_soon' | 'vendor_left' | 'send_deal' | 'stock_photo';
export type ActionStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'needs_confirm';

export type QueuedAction = {
  clientId: string;
  kind: ActionKind;
  payload: Record<string, unknown>;
  label: string;
  createdAt: number;
  status: ActionStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

export type QueueStorage = { load: () => Promise<QueuedAction[]>; save: (a: QueuedAction[]) => Promise<void> };
export type Executor = (a: QueuedAction) => Promise<void>;

/** Error that will not succeed on retry (e.g. arrival_cooldown, deal_limit). */
export class PermanentError extends Error {}

export const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 120_000];
export const MAX_ATTEMPTS = 8;

export function backoff(attempts: number): number {
  return BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)] ?? 120_000;
}

export class ActionQueue {
  private items: QueuedAction[] = [];
  private listeners = new Set<(a: QueuedAction[]) => void>();
  private flushing = false;

  constructor(
    private storage: QueueStorage,
    private executor: Executor,
    private now: () => number = () => Date.now(),
  ) {}

  async init(): Promise<void> {
    this.items = (await this.storage.load()).map((a) => (a.status === 'sending' ? { ...a, status: 'queued' as const } : a));
    this.emit();
  }

  list(): QueuedAction[] {
    return this.items;
  }

  /** Waiting = not yet sent (queued, sending, failed, needs_confirm). */
  pending(): QueuedAction[] {
    return this.items.filter((a) => a.status !== 'sent');
  }

  subscribe(fn: (a: QueuedAction[]) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async enqueue(a: { clientId: string; kind: ActionKind; payload: Record<string, unknown>; label: string }): Promise<QueuedAction> {
    const existing = this.items.find((x) => x.clientId === a.clientId);
    if (existing) return existing; // same tap enqueued twice
    // A newer sold-out toggle or menu publish replaces an older unsent one for the same target.
    this.items = this.items.filter((x) => !(x.status === 'queued' && supersedes(a, x)));
    const item: QueuedAction = { ...a, createdAt: this.now(), status: 'queued', attempts: 0, nextAttemptAt: this.now() };
    this.items = [...this.items, item];
    await this.persist();
    return item;
  }

  /** Sends everything due, oldest first. Arrivals older than 30 minutes wait for the vendor's OK. */
  async flush(online: boolean): Promise<void> {
    if (!online || this.flushing) return;
    this.flushing = true;
    try {
      for (const a of [...this.items]) {
        const cur = this.items.find((x) => x.clientId === a.clientId);
        if (!cur || (cur.status !== 'queued' && cur.status !== 'failed') || cur.nextAttemptAt > this.now()) continue;
        if (cur.attempts >= MAX_ATTEMPTS && cur.status === 'failed') continue;
        if (cur.kind === 'vendor_arrive' && this.now() - cur.createdAt > LIMITS.staleArrivalMinutes * 60_000 && !cur.payload.confirmed) {
          await this.update(cur.clientId, { status: 'needs_confirm' });
          continue;
        }
        await this.update(cur.clientId, { status: 'sending' });
        try {
          await this.executor(cur);
          await this.update(cur.clientId, { status: 'sent', lastError: undefined });
        } catch (e) {
          const attempts = cur.attempts + 1;
          const permanent = e instanceof PermanentError;
          await this.update(cur.clientId, {
            status: 'failed',
            attempts: permanent ? MAX_ATTEMPTS : attempts,
            nextAttemptAt: this.now() + backoff(attempts),
            lastError: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  /** Manual retry from X-04 (resets backoff). */
  async retry(clientId: string): Promise<void> {
    await this.update(clientId, { status: 'queued', nextAttemptAt: this.now(), attempts: 0 });
  }

  /** Stale arrival: vendor says "Send anyway" (confirm) or "Don't send" (discard). */
  async confirmStale(clientId: string, send: boolean): Promise<void> {
    const a = this.items.find((x) => x.clientId === clientId);
    if (!a) return;
    if (send) await this.update(clientId, { status: 'queued', payload: { ...a.payload, confirmed: true }, nextAttemptAt: this.now() });
    else await this.remove(clientId);
  }

  async remove(clientId: string): Promise<void> {
    this.items = this.items.filter((x) => x.clientId !== clientId);
    await this.persist();
  }

  /** Drops sent items older than a day so the list stays short. */
  async prune(): Promise<void> {
    const cutoff = this.now() - 86_400_000;
    this.items = this.items.filter((a) => a.status !== 'sent' || a.createdAt > cutoff);
    await this.persist();
  }

  private async update(clientId: string, patch: Partial<QueuedAction>): Promise<void> {
    this.items = this.items.map((x) => (x.clientId === clientId ? { ...x, ...patch } : x));
    await this.persist();
  }

  private async persist(): Promise<void> {
    await this.storage.save(this.items);
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.items);
  }
}

function supersedes(next: { kind: ActionKind; payload: Record<string, unknown> }, old: QueuedAction): boolean {
  if (next.kind !== old.kind) return false;
  if (next.kind === 'publish_menu' || next.kind === 'stock_photo') return true;
  if (next.kind === 'set_sold_out') return next.payload.item_id === old.payload.item_id;
  return false;
}
