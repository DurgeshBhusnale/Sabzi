export type Summary = {
  from: string; to: string; verified_vendors: number; active_vendors: number; active_vendor_pct: number | null; buyers: number; followers: number; flats: number;
  adoption_pct: number | null; alerts: number; alert_open_rate_pct: number | null; pilot_start: string | null; week4_cohort: number; week4_retention_pct: number | null;
  vendors_10_ratings: number; vendors_10_ratings_pct: number | null;
};
export type Daily = { date: string; alerts: number; opens: number };
export type SocietyMetric = { society_id: string; name: string; area: string; flats: number; followers: number; vendors: number; adoption_pct: number };
export type VendorMetric = { vendor_id: string; name: string; followers: number; menu_days: number; arrivals: number; rating_count: number; avg_rating: number | null };

/** PRD §1 targets. */
export const TARGETS = { active_vendor_pct: 70, adoption_pct: 15, alert_open_rate_pct: 30, week4_retention_pct: 40, vendors_10_ratings_pct: 50 } as const;

export const pct = (v: number | null | undefined) => (v == null ? '—' : `${Number(v)}%`);

/** Societies needing attention: no vendors, or adoption under a third of the target. */
export function needsAttention(s: SocietyMetric[]): (SocietyMetric & { why: string })[] {
  return s
    .map((x) => ({ ...x, why: x.vendors === 0 ? 'No vendors yet' : Number(x.adoption_pct) < TARGETS.adoption_pct / 3 ? `Low adoption (${x.adoption_pct}%)` : '' }))
    .filter((x) => x.why);
}

export function hasPilotData(s: Summary | null, daily: Daily[] | null): boolean {
  return !!s && (s.followers > 0 || s.alerts > 0 || (daily ?? []).some((d) => d.alerts > 0));
}
