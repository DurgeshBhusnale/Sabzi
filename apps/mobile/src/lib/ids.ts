import * as Crypto from 'expo-crypto';

/** Idempotency key for queued vendor actions (TECH_SPEC §8). */
export function newClientId(): string {
  return Crypto.randomUUID();
}
