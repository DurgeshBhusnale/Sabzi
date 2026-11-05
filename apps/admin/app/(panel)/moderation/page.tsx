'use client';
import { useState } from 'react';
import { formatIstRelative } from '@sabzi/shared/format';
import { REPORT_REASON_LABELS, type ReportReason } from '@sabzi/shared/constants';
import { Button, Card, Confirm, Empty, Field, Input, PageTitle, Skeleton, Tabs } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';

type Mod = {
  reports: { id: string; vendor_id: string; vendor_name: string; vendor_status: string; reason: ReportReason; text: string | null; reporter: string; created_at: string }[];
  flags: { id: string; review_id: string; vendor_name: string; reason: string; stars: number; text: string | null; reviewer: string; created_at: string }[];
};

type Pending = { kind: 'hide'; reviewId: string } | { kind: 'warn' | 'suspend' | 'dismiss'; reportId: string; vendorId: string } | null;

/** A-09: reported vendors and flagged reviews; hide (reason sent to reviewer), keep, warn, suspend. */
export default function Moderation() {
  const d = useData(() => rpc<Mod>('admin_moderation'));
  const [tab, setTab] = useState<'reports' | 'flags'>('reports');
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!pending) return;
    setError(null);
    try {
      if (pending.kind === 'hide') await rpc('hide_review', { p_review_id: pending.reviewId, p_reason: note });
      if (pending.kind === 'warn') await rpc('warn_vendor', { p_report_id: pending.reportId, p_note: note });
      if (pending.kind === 'dismiss') await rpc('resolve_report', { p_report_id: pending.reportId, p_status: 'dismissed', p_note: note || null });
      if (pending.kind === 'suspend') {
        await rpc('set_vendor_status', { p_vendor_id: pending.vendorId, p_status: 'suspended', p_reason: note });
        await rpc('resolve_report', { p_report_id: pending.reportId, p_status: 'actioned', p_note: 'Vendor suspended' });
      }
      setPending(null);
      setNote('');
      d.reload();
    } catch (e) {
      setError((e as Error).message === 'reason_required' ? 'Please write a reason.' : (e as Error).message);
    }
  };

  if (d.loading && !d.data) return <Skeleton rows={6} />;
  const m = d.data!;
  return (
    <>
      <PageTitle title="Moderation" />
      <div className="mb-md"><Tabs value={tab} onChange={setTab} options={[{ value: 'reports', label: 'Reported vendors', count: m.reports.length }, { value: 'flags', label: 'Flagged reviews', count: m.flags.length }]} /></div>
      {tab === 'reports' ? (
        m.reports.length === 0 ? <Empty title="All clear" body="No open reports." /> : m.reports.map((r) => (
          <Card key={r.id} className="mb-sm flex items-start justify-between gap-md">
            <div>
              <p className="font-semibold">{`${r.vendor_name} · ${REPORT_REASON_LABELS[r.reason]}`}</p>
              <p className="text-text-secondary">{r.text}</p>
              <p className="text-sm text-text-muted">{`${r.reporter} · ${formatIstRelative(r.created_at)}`}</p>
            </div>
            <div className="flex gap-xs">
              <Button variant="tertiary" onClick={() => setPending({ kind: 'dismiss', reportId: r.id, vendorId: r.vendor_id })}>Keep</Button>
              <Button variant="secondary" onClick={() => setPending({ kind: 'warn', reportId: r.id, vendorId: r.vendor_id })}>Warn vendor</Button>
              <Button variant="destructive" onClick={() => setPending({ kind: 'suspend', reportId: r.id, vendorId: r.vendor_id })}>Suspend vendor</Button>
            </div>
          </Card>
        ))
      ) : m.flags.length === 0 ? <Empty title="All clear" body="No flagged reviews." /> : m.flags.map((f) => (
        <Card key={f.id} className="mb-sm flex items-start justify-between gap-md">
          <div>
            <p className="font-semibold">{`${f.stars}★ by ${f.reviewer} on ${f.vendor_name}`}</p>
            <p>{f.text}</p>
            <p className="text-sm text-text-secondary">{`Vendor says: ${f.reason}`}</p>
          </div>
          <div className="flex gap-xs">
            <Button variant="tertiary" onClick={async () => { await rpc('keep_review', { p_review_id: f.review_id }); d.reload(); }}>Keep</Button>
            <Button variant="destructive" onClick={() => setPending({ kind: 'hide', reviewId: f.review_id })}>Hide review</Button>
          </div>
        </Card>
      ))}
      <Confirm
        open={!!pending}
        title={pending?.kind === 'hide' ? 'Hide this review?' : pending?.kind === 'suspend' ? 'Suspend this vendor?' : pending?.kind === 'warn' ? 'Warn the vendor' : 'Keep and close this report'}
        body={pending?.kind === 'hide' ? 'The reviewer is told why. Others stop seeing it.' : undefined}
        confirmLabel="Confirm"
        destructive={pending?.kind === 'hide' || pending?.kind === 'suspend'}
        onCancel={() => setPending(null)}
        onConfirm={run}
      >
        <div className="mt-md"><Field label={pending?.kind === 'hide' ? 'Reason (sent to the reviewer)' : 'Note'} error={error}><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
      </Confirm>
    </>
  );
}
