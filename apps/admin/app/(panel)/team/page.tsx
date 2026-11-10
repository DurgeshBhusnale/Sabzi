'use client';
import { useState } from 'react';
import { Badge, Button, Card, Field, Input, PageTitle, Select, Skeleton, Table } from '../../../components/ui';
import { rpc, sb } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';
import { useAdmin } from '../../../lib/admin';

type Member = { user_id: string; name: string | null; email: string | null; admin_level: 'owner' | 'field_staff'; active: boolean };

/** A-10 (owner only): team with roles; invite by email; deactivate. */
export default function Team() {
  const { me } = useAdmin();
  const d = useData(() => rpc<Member[]>('admin_team'));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'owner' | 'field_staff'>('field_staff');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await sb().functions.invoke('admin-invite', { body: { email, name, level } });
    setBusy(false);
    if (error) return setMsg("Couldn't send the invite. Check the email and try again.");
    setMsg(`Invite sent to ${email}.`);
    setEmail('');
    setName('');
    d.reload();
  };

  if (d.loading && !d.data) return <Skeleton rows={4} />;
  return (
    <>
      <PageTitle title="Team" />
      <Card className="mb-lg grid grid-cols-[1fr_1fr_180px_auto] items-end gap-sm">
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Role"><Select value={level} onChange={(e) => setLevel(e.target.value as 'owner' | 'field_staff')}><option value="field_staff">Field staff</option><option value="owner">Owner</option></Select></Field>
        <Button onClick={invite} loading={busy} disabled={!email.includes('@') || name.trim().length < 2}>Invite</Button>
      </Card>
      {msg ? <p role="status" className="mb-md">{msg}</p> : null}
      <Table head={['Name', 'Email', 'Role', 'Status', '']}>
        {(d.data ?? []).map((m) => (
          <tr key={m.user_id}>
            <td className="px-[20px] py-sm font-medium">{m.name}</td>
            <td className="px-[20px] py-sm">{m.email}</td>
            <td className="px-[20px] py-sm">{m.admin_level === 'owner' ? 'Owner' : 'Field staff'}</td>
            <td className="px-[20px] py-sm">{m.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
            <td className="px-[20px] py-sm">{m.user_id !== me?.user_id ? <Button variant="tertiary" onClick={async () => { await rpc('set_admin_active', { p_user_id: m.user_id, p_active: !m.active }); d.reload(); }}>{m.active ? 'Deactivate' : 'Activate'}</Button> : null}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
