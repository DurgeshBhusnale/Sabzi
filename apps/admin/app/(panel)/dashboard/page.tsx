'use client';
import { useState } from 'react';
import { addDays, toIstDate } from '@sabzi/shared/format';
import { BarChart, LineChart } from '../../../components/charts';
import { Card, Empty, PageTitle, Select, Skeleton, Table } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import { hasPilotData, needsAttention, pct, TARGETS, type Daily, type SocietyMetric, type Summary, type VendorMetric } from '../../../lib/metrics';

type Area = 'all' | 'karve_nagar' | 'sus_pashan';

function Metric({ label, value, target, hint }: { label: string; value: string; target?: string; hint?: string }) {
  return (
    <Card className="flex flex-col gap-xxs">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
      {target ? <p className="text-xs text-text-muted">{`Target ${target}`}</p> : null}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </Card>
  );
}

/** A-02 pilot dashboard (ADM-7): filters, six metric cards, daily alerts chart, followers by society, tables. */
export default function Dashboard() {
  const [area, setArea] = useState<Area>('all');
  const [days, setDays] = useState(28);
  const to = toIstDate();
  const from = addDays(to, -(days - 1));
  const args = { p_area: area === 'all' ? null : area, p_from: from, p_to: to };
  const summary = useData(() => rpc<Summary>('metrics_summary', args), [area, days]);
  const daily = useData(() => rpc<Daily[]>('metrics_daily', args), [area, days]);
  const societies = useData(() => rpc<SocietyMetric[]>('metrics_societies', { p_area: args.p_area }), [area]);
  const vendors = useData(() => rpc<VendorMetric[]>('metrics_vendors', args), [area, days]);
  const loading = summary.loading || daily.loading || societies.loading || vendors.loading;
  const s = summary.data;

  return (
    <>
      <PageTitle
        title="Dashboard"
        actions={
          <>
            <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value as Area)}>
              <option value="all">All areas</option>
              <option value="karve_nagar">Karve Nagar</option>
              <option value="sus_pashan">Sus–Pashan</option>
            </Select>
            <Select aria-label="Date range" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </Select>
          </>
        }
      />
      {loading && !s ? (
        <Skeleton rows={8} />
      ) : !hasPilotData(s, daily.data) ? (
        <Card><Empty title="No pilot data yet" body="Numbers appear once buyers follow vendors and vendors send arrival alerts." /></Card>
      ) : (
        <div className="flex flex-col gap-lg">
          <div className="grid grid-cols-3 gap-md xl:grid-cols-6">
            <Metric label="Active vendors" value={`${s!.active_vendors} / ${s!.verified_vendors}`} target={`${TARGETS.active_vendor_pct}%`} hint={`${pct(s!.active_vendor_pct)} posted 5+ days a week`} />
            <Metric label="Buyers" value={String(s!.buyers)} hint={`${s!.followers} following a vendor`} />
            <Metric label="Society adoption" value={pct(s!.adoption_pct)} target={`${TARGETS.adoption_pct}% of flats`} />
            <Metric label="Alert open rate" value={pct(s!.alert_open_rate_pct)} target={`${TARGETS.alert_open_rate_pct}% in 15 min`} hint={`${s!.alerts} arrival alerts`} />
            <Metric label="Week-4 retention" value={pct(s!.week4_retention_pct)} target={`${TARGETS.week4_retention_pct}%`} hint={s!.week4_retention_pct == null ? 'After week 4 of the pilot' : `${s!.week4_cohort} buyers in week 1`} />
            <Metric label="Vendors with 10+ ratings" value={pct(s!.vendors_10_ratings_pct)} target={`${TARGETS.vendors_10_ratings_pct}% of active`} hint={`${s!.vendors_10_ratings} vendors`} />
          </div>
          <div className="grid grid-cols-2 gap-lg">
            <Card>
              <h2 className="mb-sm font-heading text-lg font-semibold">Arrival alerts and opens (within 15 min)</h2>
              <LineChart label="Daily arrival alerts and opens" series={['Alerts sent', 'Opened in 15 min']} data={(daily.data ?? []).map((d) => ({ x: d.date, values: [d.alerts, d.opens] }))} />
            </Card>
            <Card>
              <h2 className="mb-sm font-heading text-lg font-semibold">Followers by society</h2>
              <BarChart label="Followers by society" data={(societies.data ?? []).map((x) => ({ label: x.name, value: x.followers, note: `${x.adoption_pct}% of ${x.flats} flats` }))} />
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-lg">
            <div>
              <h2 className="mb-sm font-heading text-lg font-semibold">Top vendors</h2>
              <Table head={['Vendor', 'Followers', 'Menu days', 'Arrivals', 'Rating']}>
                {(vendors.data ?? []).slice(0, 10).map((v) => (
                  <tr key={v.vendor_id}>
                    <td className="px-sm py-xs font-medium">{v.name}</td>
                    <td className="px-sm py-xs tabular-nums">{v.followers}</td>
                    <td className="px-sm py-xs tabular-nums">{v.menu_days}</td>
                    <td className="px-sm py-xs tabular-nums">{v.arrivals}</td>
                    <td className="px-sm py-xs tabular-nums">{v.rating_count ? `${v.avg_rating} (${v.rating_count})` : 'New'}</td>
                  </tr>
                ))}
              </Table>
            </div>
            <div>
              <h2 className="mb-sm font-heading text-lg font-semibold">Societies needing attention</h2>
              <Table head={['Society', 'Why', 'Followers', 'Vendors']} empty={needsAttention(societies.data ?? []).length === 0 ? <Empty title="All societies on track" /> : null}>
                {needsAttention(societies.data ?? []).map((x) => (
                  <tr key={x.society_id}>
                    <td className="px-sm py-xs font-medium">{x.name}</td>
                    <td className="px-sm py-xs">{x.why}</td>
                    <td className="px-sm py-xs tabular-nums">{x.followers}</td>
                    <td className="px-sm py-xs tabular-nums">{x.vendors}</td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-primary">Show chart data as a table</summary>
            <Table head={['Date', 'Alerts sent', 'Opened in 15 min']}>
              {(daily.data ?? []).map((d) => (
                <tr key={d.date}><td className="px-sm py-xs">{d.date}</td><td className="px-sm py-xs tabular-nums">{d.alerts}</td><td className="px-sm py-xs tabular-nums">{d.opens}</td></tr>
              ))}
            </Table>
          </details>
        </div>
      )}
    </>
  );
}
