import * as Crypto from 'expo-crypto';

function fallbackUuid(): string {
  const b = Crypto.getRandomBytes?.(16) ?? Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Idempotency key for queued vendor actions (TECH_SPEC §8). */
export function newClientId(): string {
  try {
    return Crypto.randomUUID() || fallbackUuid();
  } catch {
    return fallbackUuid();
  }
}
