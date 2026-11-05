'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PILOT_AREAS, PILOT_AREA_LABELS } from '@sabzi/shared/constants';
import { gateSchema, societySchema } from '@sabzi/shared/schemas';
import { Button, Card, Field, Input, PageTitle, Select, Skeleton } from '../../../../components/ui';
import { rpc, sb } from '../../../../lib/supabase';
import { useData } from '../../../../lib/hooks';
import type { Gate, SocietyRow } from '../../../../lib/types';

type Form = { name: string; area: 'karve_nagar' | 'sus_pashan'; address: string; lat: string; lng: string; flats_count: string; active: boolean };

/**
 * A-04: society form with gates. Map pins are entered as coordinates (paste from Google Maps "What's here?")
 * with a link to check them on the map; each gate has its own pin.
 */
export default function SocietyDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const all = useData(() => (isNew ? Promise.resolve([] as SocietyRow[]) : rpc<SocietyRow[]>('admin_societies')), [id]);
  const s = all.data?.find((x) => x.id === id);
  if (!isNew && all.loading) return <Skeleton rows={6} />;
  return <SocietyForm key={s?.id ?? 'new'} society={s ?? null} onSaved={(newId) => (isNew ? router.replace(`/societies/${newId}`) : all.reload())} />;
}

function SocietyForm({ society, onSaved }: { society: SocietyRow | null; onSaved: (id: string) => void }) {
  const [f, setF] = useState<Form>({
    name: society?.name ?? '',
    area: society?.area ?? 'karve_nagar',
    address: society?.address ?? '',
    lat: society ? String(society.lat) : '',
    lng: society ? String(society.lng) : '',
    flats_count: society ? String(society.flats_count) : '',
    active: society?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [gates, setGates] = useState<Gate[]>(society?.gates ?? []);
  const [newGate, setNewGate] = useState({ name: '', lat: '', lng: '' });
  const [gateError, setGateError] = useState<string | null>(null);

  const save = async () => {
    const parsed = societySchema.safeParse({ ...f, lat: Number(f.lat), lng: Number(f.lng), flats_count: Number(f.flats_count) });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (society) {
        const { error } = await sb().from('societies').update(parsed.data).eq('id', society.id);
        if (error) throw error;
        onSaved(society.id);
      } else {
        const { data, error } = await sb().from('societies').insert(parsed.data).select('id').single();
        if (error) throw error;
        onSaved(data.id);
      }
    } catch (e) {
      setErrors({ form: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const addGate = async () => {
    const parsed = gateSchema.safeParse({ name: newGate.name, lat: Number(newGate.lat), lng: Number(newGate.lng) });
    if (!parsed.success || !society) return setGateError(parsed.success ? 'Save the society first.' : parsed.error.issues[0]!.message);
    const { data, error } = await sb().from('gates').insert({ ...parsed.data, society_id: society.id }).select('id, name, lat, lng').single();
    if (error) return setGateError(error.message);
    setGates([...gates, data as Gate]);
    setNewGate({ name: '', lat: '', lng: '' });
    setGateError(null);
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const mapLink = (lat: string | number, lng: string | number) => `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <>
      <PageTitle title={society ? society.name : 'New society'} actions={<Button onClick={save} loading={saving}>{saving ? 'Saving' : 'Save'}</Button>} />
      <div className="grid grid-cols-2 gap-lg">
        <Card className="flex flex-col gap-md">
          <Field label="Name" error={errors.name}><Input value={f.name} onChange={set('name')} /></Field>
          <Field label="Area" error={errors.area}>
            <Select value={f.area} onChange={set('area')}>{PILOT_AREAS.map((a) => <option key={a} value={a}>{PILOT_AREA_LABELS[a]}</option>)}</Select>
          </Field>
          <Field label="Address" error={errors.address}><Input value={f.address} onChange={set('address')} /></Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Map pin latitude" error={errors.lat}><Input inputMode="decimal" value={f.lat} onChange={set('lat')} /></Field>
            <Field label="Map pin longitude" error={errors.lng}><Input inputMode="decimal" value={f.lng} onChange={set('lng')} /></Field>
          </div>
          {f.lat && f.lng ? <a className="text-sm text-info underline" target="_blank" rel="noreferrer" href={mapLink(f.lat, f.lng)}>Check pin on the map</a> : null}
          <Field label="Number of flats" error={errors.flats_count}><Input inputMode="numeric" value={f.flats_count} onChange={set('flats_count')} /></Field>
          <label className="flex items-center gap-xs"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          {errors.form ? <p role="alert" className="text-error">{errors.form}</p> : null}
        </Card>
        <Card className="flex flex-col gap-md">
          <h2 className="font-heading text-lg font-semibold">Gates</h2>
          {gates.length === 0 ? <p className="text-text-secondary">Add at least one gate. Vendors arrive at a gate.</p> : null}
          {gates.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-input bg-surface-2 px-sm py-xs">
              <span className="font-medium">{g.name}</span>
              <a className="text-sm text-info underline" target="_blank" rel="noreferrer" href={mapLink(g.lat, g.lng)}>{`${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}`}</a>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-xs">
            <Input placeholder="Gate name" value={newGate.name} onChange={(e) => setNewGate({ ...newGate, name: e.target.value })} aria-label="Gate name" />
            <Input placeholder="Latitude" value={newGate.lat} onChange={(e) => setNewGate({ ...newGate, lat: e.target.value })} aria-label="Gate latitude" />
            <Input placeholder="Longitude" value={newGate.lng} onChange={(e) => setNewGate({ ...newGate, lng: e.target.value })} aria-label="Gate longitude" />
          </div>
          {gateError ? <p className="text-sm text-error">{gateError}</p> : null}
          <Button variant="secondary" onClick={addGate} disabled={!society}>Add gate</Button>
          {society ? <a className="text-sm text-primary underline" href={`/api/poster/${society.id}`}>Print society poster (A4 PDF)</a> : null}
          {society ? <p className="text-sm text-text-secondary">{`${society.vendors} vendors · ${society.followers} followers · ${society.adoption_pct}% of flats`}</p> : null}
        </Card>
      </div>
    </>
  );
}
