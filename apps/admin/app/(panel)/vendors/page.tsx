'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatIstRelative } from '@sabzi/shared/format';
import { Badge, Empty, PageTitle, Skeleton, Table, Tabs } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import type { VendorRow } from '../../../lib/types';
import { STATUS_LABEL, STATUS_TONE } from '../../../lib/vendorStatus';

type Filter = 'pending' | 'verified' | 'needs_info' | 'suspended' | 'rejected';

/** A-05: vendors with status tabs; phones are masked here. */
export default function Vendors() {
  const { data, loading } = useData(() => rpc<VendorRow[]>('admin_vendors'));
  const [tab, setTab] = useState<Filter>('pending');
  const rows = (data ?? []).filter((v) => v.status === tab);
  const count = (s: Filter) => (data ?? []).filter((v) => v.status === s).length;
  return (
    <>
      <PageTitle title="Vendors" />
      <div className="mb-md">
        <Tabs value={tab} onChange={setTab} options={(['pending', 'verified', 'needs_info', 'suspended', 'rejected'] as Filter[]).map((s) => ({ value: s, label: STATUS_LABEL[s], count: count(s) }))} />
      </div>
      {loading ? (
        <Skeleton />
      ) : (
        <Table head={['Name', 'Phone', 'Vehicle', 'Stops', 'Followers', 'Rating', 'Last active', 'Status']} empty={rows.length === 0 ? <Empty title={`No ${STATUS_LABEL[tab].toLowerCase()} vendors`} /> : null}>
          {rows.map((v) => (
            <tr key={v.id} className="hover:bg-surface-2">
              <td className="px-[20px] py-sm"><Link className="font-medium text-primary" href={`/vendors/${v.id}`}>{v.display_name}</Link><div className="text-xs text-text-secondary">{v.owner_name}</div></td>
              <td className="px-[20px] py-sm tabular-nums">{v.phone_masked}</td>
              <td className="px-[20px] py-sm">{v.vehicle === 'tempo' ? 'Tempo' : 'Thela'}</td>
              <td className="px-[20px] py-sm">{v.stops}</td>
              <td className="px-[20px] py-sm">{v.followers}</td>
              <td className="px-[20px] py-sm">{v.rating_count ? `${v.avg_rating} (${v.rating_count})` : 'New'}</td>
              <td className="px-[20px] py-sm">{v.last_active ? formatIstRelative(v.last_active) : '—'}</td>
              <td className="px-[20px] py-sm"><Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
