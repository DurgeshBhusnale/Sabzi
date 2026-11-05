'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { formatIstRelative, formatPrice, formatTimeWindow } from '@sabzi/shared/format';
import { DAY_SHORT } from '@sabzi/shared/stops';
import { REPORT_REASON_LABELS, type PriceUnit, type ReportReason } from '@sabzi/shared/constants';
import { Badge, Button, Card, Confirm, Field, Input, PageTitle, Skeleton } from '../../../../components/ui';
import { rpc, sb } from '../../../../lib/supabase';
import { useData } from '../../../../lib/hooks';
import { STATUS_LABEL, STATUS_TONE } from '../../../../lib/vendorStatus';
import { buildStickerPdf, downloadPdf } from '../../../../lib/pdf';

type VendorDetail = {
  vendor: { user_id: string; display_name: string; vehicle: string; vehicle_no: string | null; pmc_vendor_id: string | null; pmc_doc_path: string | null; delivery_available: boolean; allow_calls: boolean; status: keyof typeof STATUS_LABEL; status_reason: string | null; code: string; verified_at: string | null };
  owner_name: string | null;
  phone: string | null;
  stops: { id: string; gate_name: string; society_name: string; days_of_week: number[]; window_start: string; window_end: string; active: boolean }[];
  menu: { items: { item_id: string; name: string; price: number; unit: PriceUnit; sold_out: boolean }[] } | null;
  reviews: { id: string; reviewer_name: string; stars: number; text: string | null; status: string; created_at: string }[];
  reports: { id: string; reason: ReportReason; text: string | null; status: string; created_at: string }[];
};

type Action = 'verify' | 'needs_info' | 'rejected' | 'suspended';
const ACTION_COPY: Record<Action, { title: string; body: string; label: string; destructive?: boolean; reason?: boolean }> = {
  verify: { title: 'Verify this vendor?', body: 'Buyers will see him on their home screen and can follow him.', label: 'Verify' },
  needs_info: { title: 'Ask for more information', body: 'The vendor sees this reason and can upload a new document.', label: 'Send', reason: true },
  rejected: { title: 'Reject this vendor?', body: 'The vendor sees the reason and a number to call.', label: 'Reject', destructive: true, reason: true },
  suspended: { title: 'Suspend this vendor?', body: 'Buyers stop seeing him at once. He sees "Your account is paused".', label: 'Suspend', destructive: true, reason: true },
};

/** A-06: profile, documents, verification actions with confirm dialogs, stops, menu, reviews, reports, QR sticker. */
export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const d = useData(() => rpc<VendorDetail>('admin_vendor', { p_vendor_id: id }), [id]);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (d.loading && !d.data) return <Skeleton rows={8} />;
  if (!d.data) return <p>{d.error}</p>;
  const { vendor: v } = d.data;

  const run = async () => {
    setError(null);
    try {
      if (action === 'verify') await rpc('verify_vendor', { p_vendor_id: v.user_id });
      else await rpc('set_vendor_status', { p_vendor_id: v.user_id, p_status: action, p_reason: reason });
      setAction(null);
      setReason('');
      d.reload();
    } catch (e) {
      setError((e as Error).message === 'reason_required' ? 'Please write a reason.' : (e as Error).message);
    }
  };

  const showDoc = async () => {
    if (!v.pmc_doc_path) return;
    const { data } = await sb().storage.from('pmc-docs').createSignedUrl(v.pmc_doc_path, 300);
    setDocUrl(data?.signedUrl ?? null);
  };

  return (
    <>
      <PageTitle
        title={v.display_name}
        actions={
          <>
            {v.status !== 'verified' ? <Button onClick={() => setAction('verify')}>Verify</Button> : null}
            {v.status === 'pending' ? <Button variant="secondary" onClick={() => setAction('needs_info')}>Ask for info</Button> : null}
            {v.status === 'pending' || v.status === 'needs_info' ? <Button variant="secondary" onClick={() => setAction('rejected')}>Reject</Button> : null}
            {v.status === 'verified' ? <Button variant="destructive" onClick={() => setAction('suspended')}>Suspend</Button> : null}
            <Button
              variant="secondary"
              onClick={async () => {
                let photo: Uint8Array | null = null;
                const path = (d.data!.vendor as { photo_path?: string | null }).photo_path;
                if (path) {
                  const res = await fetch(sb().storage.from('vendor-photos').getPublicUrl(path).data.publicUrl).catch(() => null);
                  if (res?.ok) photo = new Uint8Array(await res.arrayBuffer());
                }
                const { pdf } = await buildStickerPdf({ name: v.display_name, code: v.code, verified: v.status === 'verified', photoJpg: photo });
                downloadPdf(pdf, `sticker-${v.code}.pdf`);
              }}
            >
              QR sticker (PDF)
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-lg">
        <Card className="flex flex-col gap-xs">
          <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
          {v.status_reason ? <p className="text-sm text-text-secondary">{`Reason: ${v.status_reason}`}</p> : null}
          <p><span className="text-text-secondary">Owner: </span>{d.data.owner_name}</p>
          <p><span className="text-text-secondary">Phone: </span><a className="text-primary" href={`tel:${d.data.phone}`}>{d.data.phone}</a></p>
          <p><span className="text-text-secondary">Vehicle: </span>{`${v.vehicle === 'tempo' ? 'Tempo' : 'Thela'} ${v.vehicle_no ?? ''}`}</p>
          <p><span className="text-text-secondary">PMC ID: </span>{v.pmc_vendor_id ?? '—'}</p>
          <p><span className="text-text-secondary">Home delivery: </span>{v.delivery_available ? 'Yes' : 'No'} · <span className="text-text-secondary">Calls: </span>{v.allow_calls ? 'Allowed' : 'Off'}</p>
          <p><span className="text-text-secondary">QR code: </span><code>{v.code}</code></p>
          {v.pmc_doc_path ? (
            <>
              <Button variant="tertiary" onClick={showDoc}>Show PMC ID photo</Button>
              {docUrl ? <img src={docUrl} alt="PMC ID document" className="rounded-photo" /> : null}
            </>
          ) : <p className="text-sm text-text-muted">No document uploaded</p>}
        </Card>
        <Card className="flex flex-col gap-xs">
          <h2 className="font-heading text-lg font-semibold">Stops</h2>
          {d.data.stops.length === 0 ? <p className="text-text-secondary">No stops yet. Add them in the stops planner.</p> : null}
          {d.data.stops.map((s) => (
            <p key={s.id} className={s.active ? '' : 'text-text-muted line-through'}>{`${s.society_name} · ${s.gate_name} — ${s.days_of_week.map((x) => DAY_SHORT[x - 1]).join(' ')} ${formatTimeWindow(s.window_start, s.window_end)}`}</p>
          ))}
          <h2 className="mt-md font-heading text-lg font-semibold">Today’s menu</h2>
          {d.data.menu?.items.length ? d.data.menu.items.map((i) => <p key={i.item_id} className={i.sold_out ? 'text-text-muted line-through' : ''}>{`${i.name} — ${formatPrice(Number(i.price), i.unit)}`}</p>) : <p className="text-text-secondary">Not posted today</p>}
        </Card>
        <Card className="flex flex-col gap-xs">
          <h2 className="font-heading text-lg font-semibold">Reviews</h2>
          {d.data.reviews.slice(0, 6).map((r) => <p key={r.id}>{`${r.stars}★ ${r.reviewer_name}: ${r.text ?? ''}`}{r.status === 'hidden' ? ' (hidden)' : ''}</p>)}
          <h2 className="mt-md font-heading text-lg font-semibold">Reports</h2>
          {d.data.reports.length === 0 ? <p className="text-text-secondary">None</p> : d.data.reports.map((r) => <p key={r.id}>{`${REPORT_REASON_LABELS[r.reason]} · ${formatIstRelative(r.created_at)} · ${r.status}`}</p>)}
        </Card>
      </div>
      <Confirm open={!!action} title={action ? ACTION_COPY[action].title : ''} body={action ? ACTION_COPY[action].body : ''} confirmLabel={action ? ACTION_COPY[action].label : ''} destructive={action ? ACTION_COPY[action].destructive : false} onCancel={() => setAction(null)} onConfirm={run}>
        {action && ACTION_COPY[action].reason ? <div className="mt-md"><Field label="Reason (shown to the vendor)" error={error}><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div> : error ? <p className="text-error">{error}</p> : null}
      </Confirm>
    </>
  );
}
