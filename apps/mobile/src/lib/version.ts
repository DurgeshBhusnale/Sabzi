/** Compares dotted versions: -1 if a < b, 0 if equal, 1 if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export type AppStatus = { kind: 'ok' } | { kind: 'force_update' } | { kind: 'optional_update' } | { kind: 'maintenance'; until: string | null };

/** X-11 / X-12 / X-13 from app_settings (A-11). Maintenance wins over updates. */
export function appStatus(current: string, settings: Record<string, unknown>): AppStatus {
  const m = settings.maintenance as { enabled?: boolean; until?: string | null } | undefined;
  if (m?.enabled) return { kind: 'maintenance', until: m.until ?? null };
  const min = typeof settings.min_app_version === 'string' ? settings.min_app_version : null;
  if (min && compareVersions(current, min) < 0) return { kind: 'force_update' };
  const latest = typeof settings.latest_app_version === 'string' ? settings.latest_app_version : null;
  if (latest && compareVersions(current, latest) < 0) return { kind: 'optional_update' };
  return { kind: 'ok' };
}
