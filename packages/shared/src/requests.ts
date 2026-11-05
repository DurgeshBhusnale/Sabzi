/** VEN-10: group tomorrow's requests by item and sum quantities. */
export type RequestLite = {
  id: string;
  item_id: string | null;
  item_name: string | null;
  free_text: string | null;
  qty: string | null;
  note: string | null;
  buyer_first_name: string;
  society_name: string;
  status: 'open' | 'will_bring' | 'cant_bring' | 'cancelled';
};

export type RequestGroup = {
  key: string;
  name: string;
  count: number;
  totalLabel: string | null;
  societies: string[];
  notes: { buyer: string; society: string; qty: string | null; note: string }[];
  status: 'open' | 'will_bring' | 'cant_bring' | 'mixed';
};

type Parsed = { kind: 'g' | 'piece' | 'bunch'; amount: number } | null;

/** "500 g", "1 kg", "1.5kg", "2 pieces", "3 bunch" → normalised amount. Unknown text → null. */
export function parseQty(q: string | null | undefined): Parsed {
  if (!q) return null;
  const m = q.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|grams?|pc|pcs|piece|pieces|bunch|bunches)$/);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2]!;
  if (u.startsWith('kg')) return { kind: 'g', amount: n * 1000 };
  if (u.startsWith('g')) return { kind: 'g', amount: n };
  if (u.startsWith('bunch')) return { kind: 'bunch', amount: n };
  return { kind: 'piece', amount: n };
}

function fmtGrams(g: number): string {
  if (g >= 1000) {
    const kg = g / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  return `${g} g`;
}

/**
 * Totals per unit kind: "1.5 kg", "3 pieces", "1.5 kg + 2 pieces". Requests without a quantity count
 * as one buyer each and are not added to the total; if none have a quantity the total is null.
 */
export function sumQuantities(qtys: (string | null)[]): string | null {
  let g = 0;
  let pc = 0;
  let bunch = 0;
  const unknown: string[] = [];
  for (const q of qtys) {
    const p = parseQty(q);
    if (!p) {
      if (q && q.trim()) unknown.push(q.trim());
      continue;
    }
    if (p.kind === 'g') g += p.amount;
    else if (p.kind === 'piece') pc += p.amount;
    else bunch += p.amount;
  }
  const parts: string[] = [];
  if (g) parts.push(fmtGrams(g));
  if (pc) parts.push(`${pc} ${pc === 1 ? 'piece' : 'pieces'}`);
  if (bunch) parts.push(`${bunch} ${bunch === 1 ? 'bunch' : 'bunches'}`);
  parts.push(...unknown);
  return parts.length ? parts.join(' + ') : null;
}

export function requestKey(r: Pick<RequestLite, 'item_id' | 'free_text'>): string {
  return r.item_id ?? `free:${(r.free_text ?? '').trim().toLowerCase()}`;
}

export function groupRequests(rows: RequestLite[]): RequestGroup[] {
  const map = new Map<string, RequestLite[]>();
  for (const r of rows) {
    if (r.status === 'cancelled') continue;
    const k = requestKey(r);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  const groups: RequestGroup[] = [];
  for (const [key, rs] of map) {
    const statuses = new Set(rs.map((r) => r.status));
    const name = rs[0]!.item_name ?? (rs[0]!.free_text ?? '').trim().replace(/^./, (c) => c.toUpperCase());
    groups.push({
      key,
      name,
      count: rs.length,
      totalLabel: sumQuantities(rs.map((r) => r.qty)),
      societies: [...new Set(rs.map((r) => r.society_name))],
      notes: rs.filter((r) => r.note).map((r) => ({ buyer: r.buyer_first_name, society: r.society_name, qty: r.qty, note: r.note! })),
      status: statuses.size === 1 ? (rs[0]!.status as RequestGroup['status']) : 'mixed',
    });
  }
  return groups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
