'use client';
import { Card, PageTitle, Skeleton } from '../../../components/ui';
import { rpc } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import type { SocietyRow, VendorRow } from '../../../lib/types';

/** A-02 placeholder; the pilot metrics come in M11. */
export default function Dashboard() {
  const v = useData(() => rpc<VendorRow[]>('admin_vendors'));
  const s = useData(() => rpc<SocietyRow[]>('admin_societies'));
  if (v.loading || s.loading) return <Skeleton rows={4} />;
  return (
    <>
      <PageTitle title="Dashboard" />
      <div className="grid grid-cols-3 gap-md">
        <Card><p className="text-3xl font-bold">{(v.data ?? []).filter((x) => x.status === 'verified').length}</p><p className="text-text-secondary">Verified vendors</p></Card>
        <Card><p className="text-3xl font-bold">{(v.data ?? []).filter((x) => x.status === 'pending').length}</p><p className="text-text-secondary">Waiting for verification</p></Card>
        <Card><p className="text-3xl font-bold">{(s.data ?? []).length}</p><p className="text-text-secondary">Societies</p></Card>
      </div>
    </>
  );
}
