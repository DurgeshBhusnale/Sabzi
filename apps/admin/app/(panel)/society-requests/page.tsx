'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatIstRelative } from '@sabzi/shared/format';
import { Badge, Button, Card, Confirm, Empty, Field, PageTitle, Select, Skeleton, Tabs } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import type { SocietyRow } from '../../../lib/types';
import { groupSocietyRequests, type SocietyRequest } from '../../../lib/societyRequests';

type Pending = { kind: 'added' | 'dismiss'; ids: string[]; name: string; societyId: string } | null;

/**
 * A-12 (owner review 2026-11-21): societies buyers asked for. Add the society (A-04, pre-filled), then mark the
 * requests as added: every buyer who asked is notified. Requests with the same name are grouped.
 */
export default function SocietyRequests() {
  const [tab, setTab] = useState<'open' | 'added' | 'dismissed'>('open');
  const d = useData(() => rpc<SocietyRequest[]>('admin_society_requests', { p_status: tab }), [tab]);
  const societies = useData(() => rpc<SocietyRow[]>('admin_societies'));
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const run = async () => {
    if (!pending) return;
    setError(null);
    try {
      const n = await rpc<number>('resolve_society_requests', {
        p_ids: pending.ids,
        p_society_id: pending.kind === 'added' ? pending.societyId : null,
        p_dismiss: pending.kind === 'dismiss',
      });
      setDone(pending.kind === 'added' ? `Marked ${n} ${n === 1 ? 'request' : 'requests'} as added. ${n === 1 ? 'The buyer is' : 'Buyers are'} being notified.` : `Dismissed ${n} ${n === 1 ? 'request' : 'requests'}.`);
      setPending(null);
      d.reload();
    } catch (e) {
      const m = (e as Error).message;
      setError(m === 'society_not_found' ? 'Pick the society you added.' : m);
    }
  };

  const groups = groupSocietyRequests(d.data ?? []);
  const options = (societies.data ?? []).filter((s) => s.active);
  return (
    <>
      <PageTitle title="Society requests" />
      <p className="mb-md max-w-2xl text-text-secondary">
        Buyers ask for these when their society is not on the app. Add the society first, then mark the request as added: everyone who asked gets a notification.
      </p>
      <div className="mb-md">
        <Tabs
          value={tab}
          onChange={(v) => { setTab(v); setDone(null); }}
          options={[{ value: 'open', label: 'Open', count: tab === 'open' ? groups.length : undefined }, { value: 'added', label: 'Added' }, { value: 'dismissed', label: 'Dismissed' }]}
        />
      </div>
      {done ? <p role="status" className="mb-md rounded-card bg-primary-tint px-md py-sm text-on-primary-tint">{done}</p> : null}
      {d.loading && !d.data ? (
        <Skeleton rows={4} />
      ) : groups.length === 0 ? (
        <Empty title={tab === 'open' ? 'No open requests' : 'Nothing here yet'} body={tab === 'open' ? 'When a buyer asks for a society, it shows up here.' : undefined} />
      ) : (
        groups.map((g) => (
          <Card key={g.key} className="mb-sm flex items-start justify-between gap-md">
            <div className="flex flex-col gap-[4px]">
              <p className="flex items-center gap-xs font-semibold">
                {g.name}
                <Badge tone={g.count > 1 ? 'amber' : 'neutral'}>{`${g.count} ${g.count === 1 ? 'buyer' : 'buyers'}`}</Badge>
                {g.listedSocietyId ? <Badge tone="blue">Listed, no vendors yet</Badge> : null}
              </p>
              {g.addresses.map((a) => <p key={a} className="text-text-secondary">{a}</p>)}
              <p className="text-sm text-text-muted">{`${g.requesters.join(', ')} · first asked ${formatIstRelative(g.firstAt)}`}</p>
              {g.resolvedName ? <p className="text-sm text-text-secondary">{`Linked to ${g.resolvedName}`}</p> : null}
            </div>
            {tab === 'open' ? (
              <div className="flex shrink-0 gap-xs">
                <Button variant="tertiary" onClick={() => setPending({ kind: 'dismiss', ids: g.ids, name: g.name, societyId: '' })}>Dismiss</Button>
                {g.listedSocietyId ? null : (
                  <Link href={`/societies/new?name=${encodeURIComponent(g.name)}&address=${encodeURIComponent(g.addresses[0] ?? '')}`}>
                    <Button variant="secondary">Add society</Button>
                  </Link>
                )}
                <Button onClick={() => setPending({ kind: 'added', ids: g.ids, name: g.name, societyId: g.listedSocietyId ?? g.suggestedId(options) ?? '' })}>Mark as added</Button>
              </div>
            ) : null}
          </Card>
        ))
      )}
      <Confirm
        open={!!pending}
        title={pending?.kind === 'added' ? `Mark “${pending.name}” as added?` : `Dismiss “${pending?.name ?? ''}”?`}
        body={pending?.kind === 'added' ? 'Buyers who asked get a notification and can pick this society in the app.' : 'Buyers are not notified.'}
        confirmLabel={pending?.kind === 'added' ? 'Mark as added and notify' : 'Dismiss'}
        destructive={pending?.kind === 'dismiss'}
        onCancel={() => { setPending(null); setError(null); }}
        onConfirm={run}
      >
        {pending?.kind === 'added' ? (
          <div className="mt-md">
            <Field label="Society in the app" error={error}>
              <Select value={pending.societyId} onChange={(e) => setPending({ ...pending, societyId: e.target.value })} aria-label="Society in the app">
                <option value="">Pick the society you added</option>
                {options.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          </div>
        ) : error ? <p className="mt-md text-error">{error}</p> : null}
      </Confirm>
    </>
  );
}
