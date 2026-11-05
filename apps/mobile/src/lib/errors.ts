import { en } from '../i18n/en';

/** RPC errors carry a machine code as the message (see supabase migrations). */
export type AppError = { code: string; message: string; detail?: string | null };

const known = en.errors as Record<string, string>;

export function toAppError(err: unknown): AppError {
  const e = (err ?? {}) as { message?: string; details?: string | null; detail?: string | null; code?: string };
  const raw = e.message ?? 'unknown';
  const code = raw in known ? raw : e.code && e.code in known ? e.code : 'unknown';
  return { code, message: known[code] ?? known.unknown!, detail: e.details ?? e.detail ?? null };
}

export class AppErrorException extends Error {
  constructor(public readonly appError: AppError) {
    super(appError.message);
  }
}

export function raise(err: unknown): never {
  throw new AppErrorException(toAppError(err));
}
