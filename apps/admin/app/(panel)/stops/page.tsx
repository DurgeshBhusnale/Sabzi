'use client';
import { useMemo, useState } from 'react';
import { formatTimeWindow } from '@sabzi/shared/format';
import { DAY_SHORT, findStopConflicts, type StopLite } from '@sabzi/shared/stops';
import { stopSchema } from '@sabzi/shared/schemas';
import { Button, Card, Empty, Field, Input, PageTitle, Select, Skeleton } from '../../../components/ui';
import { rpc, sb } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import type { SocietyRow, VendorRow } from '../../../lib/types';

type StopRow = StopLite & { id: string; active: boolean };

/** A-07: pick vendor, add stops, weekly grid, overlap warnings. */
export default function StopsPlanner() {
  const vendors = useData(() => rpc<VendorRow[]>('admin_vendors'));
  const societies = useData(() => rpc<SocietyRow[]>('admin_societies'));
  const stops = useData(async () => {
    const { data, error } = await sb().from('stops').select('id, vendor_id, gate_id, days_of_week, window_start, window_end, active');
    if (error) throw error;
    return (data ?? []) as StopRow[];
  });
  const [vendorId, setVendorId] = useState('');
  const [societyId, setSocietyId] = useState('');
  const [gateId, setGateId] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('08:45');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const gates = societies.data?.find((s) => s.id === societyId)?.gates ?? [];
  const gateLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of societies.data ?? []) for (const g of s.gates) m.set(g.id, `${s.name} · ${g.name}`);
    return m;
  }, [societies.data]);
  const candidate: StopLite = { id: null, vendor_id: vendorId, gate_id: gateId, days_of_week: days, window_start: start, window_end: end };
  const conflicts = vendorId && gateId ? findStopConflicts(candidate, stops.data ?? []) : [];
  const mine = (stops.data ?? []).filter((s) => s.vendor_id === vendorId);

  const add = async () => {
    const parsed = stopSchema.safeParse({ ...candidate, active: true });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    if (conflicts.some((c) => c.kind === 'vendor_double_booked')) return setError('This vendor already has a stop at that time.');
    setSaving(true);
    try {
      await rpc('upsert_stop', { p_id: null, p_vendor_id: vendorId, p_gate_id: gateId, p_days: days, p_start: start, p_end: end, p_active: true });
      setError(null);
      stops.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async (s: StopRow) => {
    await rpc('upsert_stop', { p_id: s.id, p_vendor_id: s.vendor_id, p_gate_id: s.gate_id, p_days: s.days_of_week, p_start: s.window_start, p_end: s.window_end, p_active: !s.active });
    stops.reload();
  };

  if (vendors.loading || societies.loading) return <Skeleton rows={6} />;
  return (
    <>
      <PageTitle title="Stops planner" />
      <div className="grid grid-cols-[360px_1fr] gap-lg">
        <Card className="flex flex-col gap-md">
          <Field label="Vendor">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} aria-label="Vendor">
              <option value="">Choose a vendor</option>
              {(vendors.data ?? []).filter((v) => v.status !== 'rejected').map((v) => <option key={v.id} value={v.id}>{v.display_name}</option>)}
            </Select>
          </Field>
          <Field label="Society">
            <Select value={societyId} onChange={(e) => { setSocietyId(e.target.value); setGateId(''); }} aria-label="Society">
              <option value="">Choose a society</option>
              {(societies.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Gate">
            <Select value={gateId} onChange={(e) => setGateId(e.target.value)} aria-label="Gate" disabled={!societyId}>
              <option value="">Choose a gate</option>
              {gates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-xxs" role="group" aria-label="Days">
            {DAY_SHORT.map((d, i) => {
              const on = days.includes(i + 1);
              return <button key={d} aria-pressed={on} onClick={() => setDays(on ? days.filter((x) => x !== i + 1) : [...days, i + 1].sort())} className={`min-h-10 rounded-chip border px-sm text-sm ${on ? 'border-primary bg-primary-tint text-primary' : 'border-border'}`}>{d}</button>;
            })}
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="From"><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="To"><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          {conflicts.map((c, i) => (
            <p key={i} role="alert" className={`rounded-input p-xs text-sm ${c.kind === 'vendor_double_booked' ? 'bg-error-tint text-error' : 'bg-warning-tint text-warning'}`}>
              {c.kind === 'vendor_double_booked'
                ? `Overlaps his stop at ${gateLabel.get(c.b.gate_id) ?? 'another gate'} (${formatTimeWindow(c.b.window_start, c.b.window_end)}) on ${c.days.map((d) => DAY_SHORT[d - 1]).join(', ')}.`
                : `Another vendor is at this gate at the same time on ${c.days.map((d) => DAY_SHORT[d - 1]).join(', ')}.`}
            </p>
          ))}
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Button onClick={add} loading={saving} disabled={!vendorId || !gateId}>Add stop</Button>
        </Card>
        <Card>
          <h2 className="mb-md font-heading text-xl italic">Week</h2>
          {!vendorId ? <Empty title="Pick a vendor to see his week" /> : mine.length === 0 ? <Empty title="No stops yet" body="Add the first stop on the left." /> : (
            <div className="grid grid-cols-7 gap-xs text-sm">
              {DAY_SHORT.map((d, i) => (
                <div key={d} className="flex flex-col gap-xs">
                  <p className="font-semibold text-text-secondary">{d}</p>
                  {mine.filter((s) => s.days_of_week.includes(i + 1)).sort((a, b) => a.window_start.localeCompare(b.window_start)).map((s) => (
                    <button key={s.id} onClick={() => toggleActive(s)} title="Click to pause or resume" className={`rounded-input p-xs text-left ${s.active ? 'bg-primary-tint text-primary' : 'bg-surface-2 text-text-muted line-through'}`}>
                      <span className="block font-semibold">{formatTimeWindow(s.window_start, s.window_end)}</span>
                      <span className="block">{gateLabel.get(s.gate_id)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
