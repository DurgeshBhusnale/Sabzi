'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PILOT_AREA_LABELS } from '@sabzi/shared/constants';
import { Button, Empty, Input, PageTitle, Skeleton, Table } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import type { SocietyRow } from '../../../lib/types';

/** A-03: societies table with adoption %; normal, empty, search no results. */
export default function Societies() {
  const { data, loading } = useData(() => rpc<SocietyRow[]>('admin_societies'));
  const [q, setQ] = useState('');
  const rows = (data ?? []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle title="Societies" actions={<Link href="/societies/new"><Button>Add society</Button></Link>} />
      <Input placeholder="Search societies" value={q} onChange={(e) => setQ(e.target.value)} className="mb-md w-80" aria-label="Search societies" />
      {loading ? (
        <Skeleton />
      ) : (
        <Table
          head={['Name', 'Area', 'Gates', 'Flats', 'Vendors', 'Followers', 'Adoption']}
          empty={!data?.length ? <Empty title="No societies yet" body="Add the first pilot society." /> : rows.length === 0 ? <Empty title={`No society called '${q}'`} /> : null}
        >
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-surface-2">
              <td className="px-sm py-xs font-medium"><Link className="text-primary" href={`/societies/${s.id}`}>{s.name}</Link></td>
              <td className="px-sm py-xs">{PILOT_AREA_LABELS[s.area]}</td>
              <td className="px-sm py-xs">{s.gates.length}</td>
              <td className="px-sm py-xs">{s.flats_count}</td>
              <td className="px-sm py-xs">{s.vendors}</td>
              <td className="px-sm py-xs">{s.followers}</td>
              <td className="px-sm py-xs">{`${s.adoption_pct}%`}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
