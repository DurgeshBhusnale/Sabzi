/** A row from `admin_society_requests` (owner review 2026-11-21). */
export type SocietyRequest = {
  id: string;
  society_name: string;
  society_address: string | null;
  society_id: string | null;
  status: 'open' | 'added' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_society_name: string | null;
  requester: string;
  same_name_count: number;
};

export type SocietyRequestGroup = {
  key: string;
  name: string;
  ids: string[];
  count: number;
  addresses: string[];
  requesters: string[];
  firstAt: string;
  /** A listed society with no vendors yet (the buyer tapped it in the picker). */
  listedSocietyId: string | null;
  resolvedName: string | null;
  /** The active society whose name matches the request, to pre-select when marking as added. */
  suggestedId: (societies: { id: string; name: string }[]) => string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** One card per society name (case and punctuation ignored), oldest request first. */
export function groupSocietyRequests(rows: SocietyRequest[]): SocietyRequestGroup[] {
  const map = new Map<string, SocietyRequest[]>();
  for (const r of rows) {
    const k = norm(r.society_name);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .map(([key, rs]) => {
      const sorted = [...rs].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return {
        key,
        name: sorted[0]!.society_name,
        ids: sorted.map((r) => r.id),
        count: sorted.length,
        addresses: [...new Set(sorted.map((r) => r.society_address).filter((a): a is string => !!a))],
        requesters: [...new Set(sorted.map((r) => r.requester))],
        firstAt: sorted[0]!.created_at,
        listedSocietyId: sorted.find((r) => r.society_id)?.society_id ?? null,
        resolvedName: sorted.find((r) => r.resolved_society_name)?.resolved_society_name ?? null,
        suggestedId: (societies: { id: string; name: string }[]) => societies.find((s) => norm(s.name) === key)?.id ?? null,
      };
    })
    .sort((a, b) => a.firstAt.localeCompare(b.firstAt));
}
