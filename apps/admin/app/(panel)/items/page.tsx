'use client';
import { produceArtKey, produceTileGround } from '@sabzi/shared/produce';
import { useState } from 'react';
import { PRICE_UNITS, UNIT_LABELS, type PriceUnit } from '@sabzi/shared/constants';
import { itemSchema } from '@sabzi/shared/schemas';
import { Badge, Button, Card, Field, Input, PageTitle, Select, Skeleton, Table } from '../../../components/ui';
import { rpc, sb } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';

type ItemRow = { id: string; name: string; default_unit: PriceUnit; image_path: string | null; approved: boolean; is_custom: boolean; created_by_name: string | null; used_by: number };

/** A-08: master list, add/edit with image upload, approve vendor custom items. */
export default function Items() {
  const d = useData(() => rpc<ItemRow[]>('admin_items'));
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<PriceUnit>('kg');
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = (d.data ?? []).filter((i) => !i.approved);
  const master = (d.data ?? []).filter((i) => i.approved);

  const save = async () => {
    const parsed = itemSchema.safeParse({ name, default_unit: unit });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    let image_path: string | undefined;
    if (file) {
      image_path = `master/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const up = await sb().storage.from('item-images').upload(image_path, file, { upsert: true });
      if (up.error) return setError(up.error.message);
    }
    const row = { ...parsed.data, ...(image_path ? { image_path } : {}) };
    const res = editing ? await sb().from('items').update(row).eq('id', editing) : await sb().from('items').insert({ ...row, approved: true });
    if (res.error) return setError(res.error.message);
    setName('');
    setFile(null);
    setEditing(null);
    setError(null);
    d.reload();
  };

  if (d.loading && !d.data) return <Skeleton rows={8} />;
  return (
    <>
      <PageTitle title="Items" />
      {pending.length ? (
        <Card className="mb-lg flex flex-col gap-xs">
          <h2 className="font-heading text-xl italic">{`Custom items waiting (${pending.length})`}</h2>
          {pending.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-md">
              <span>{`${i.name} · ${UNIT_LABELS[i.default_unit]} · added by ${i.created_by_name ?? 'a vendor'}`}</span>
              <Button variant="secondary" onClick={async () => { await rpc('approve_item', { p_item_id: i.id }); d.reload(); }}>Approve to master list</Button>
            </div>
          ))}
        </Card>
      ) : null}
      <Card className="mb-lg grid grid-cols-[1fr_160px_1fr_auto] items-end gap-sm">
        <Field label={editing ? 'Edit item name' : 'New item name'} error={error}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Default unit"><Select value={unit} onChange={(e) => setUnit(e.target.value as PriceUnit)}>{PRICE_UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}</Select></Field>
        <Field label="Picture (optional)"><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
        <Button onClick={save}>{editing ? 'Save' : 'Add item'}</Button>
      </Card>
      <Table head={['Picture', 'Name', 'Default unit', 'Used by', '']}>
        {master.map((i) => (
          <tr key={i.id}>
            <td className="px-[20px] py-sm">{i.image_path ? <Badge tone="green">Uploaded</Badge> : produceArtKey(i.name) ? <Badge tone="green">Built-in</Badge> : <Badge>Letter tile</Badge>}</td>
            <td className="px-[20px] py-sm font-medium">
              <span className="flex items-center gap-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: produceTileGround(i.name) }}>
                  {produceArtKey(i.name) ? (
                    <img src={`/images/produce/${produceArtKey(i.name)}.webp`} alt="" width={30} height={30} />
                  ) : (
                    <span className="font-heading text-lg text-primary">{i.name.charAt(0)}</span>
                  )}
                </span>
                {i.name}
              </span>
            </td>
            <td className="px-[20px] py-sm">{UNIT_LABELS[i.default_unit]}</td>
            <td className="px-[20px] py-sm">{`${i.used_by} vendors`}</td>
            <td className="px-[20px] py-sm"><Button variant="tertiary" onClick={() => { setEditing(i.id); setName(i.name); setUnit(i.default_unit); }}>Edit</Button></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
