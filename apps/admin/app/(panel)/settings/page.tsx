'use client';
import { useState } from 'react';
import { Button, Card, Confirm, Field, Input, PageTitle, Skeleton } from '../../../components/ui';
import { rpc, sb } from '../../../lib/supabase';
import { useData } from '../../../lib/hooks';

type Settings = Record<string, unknown>;

/** A-11 (owner only): OTP limits, alert limits, quiet hours, force-update version, maintenance mode (with confirm). */
export default function SettingsPage() {
  const d = useData(async () => {
    const { data, error } = await sb().from('app_settings').select('key, value');
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Settings;
  });
  if (d.loading && !d.data) return <Skeleton rows={6} />;
  return <SettingsForm initial={d.data ?? {}} onSaved={d.reload} />;
}

function SettingsForm({ initial, onSaved }: { initial: Settings; onSaved: () => void }) {
  const quiet = (initial.quiet_hours as { start: number; end: number } | undefined) ?? { start: 21, end: 6 };
  const maint = (initial.maintenance as { enabled: boolean; until: string | null } | undefined) ?? { enabled: false, until: null };
  const [f, setF] = useState({
    otp_max_failures: String(initial.otp_max_failures ?? 5),
    otp_block_minutes: String(initial.otp_block_minutes ?? 60),
    arrival_cooldown_hours: String(initial.arrival_cooldown_hours ?? 2),
    quiet_start: String(quiet.start),
    quiet_end: String(quiet.end),
    min_app_version: String(initial.min_app_version ?? '0.1.0'),
    latest_app_version: String(initial.latest_app_version ?? '0.1.0'),
    maintenance_until: maint.until ?? '',
  });
  const [confirmMaint, setConfirmMaint] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    try {
      await rpc('set_setting', { p_key: 'otp_max_failures', p_value: Number(f.otp_max_failures) });
      await rpc('set_setting', { p_key: 'otp_block_minutes', p_value: Number(f.otp_block_minutes) });
      await rpc('set_setting', { p_key: 'arrival_cooldown_hours', p_value: Number(f.arrival_cooldown_hours) });
      await rpc('set_setting', { p_key: 'quiet_hours', p_value: { start: Number(f.quiet_start), end: Number(f.quiet_end) } });
      await rpc('set_setting', { p_key: 'min_app_version', p_value: f.min_app_version });
      await rpc('set_setting', { p_key: 'latest_app_version', p_value: f.latest_app_version });
      setMsg('Saved.');
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const setMaintenance = async (enabled: boolean) => {
    await rpc('set_setting', { p_key: 'maintenance', p_value: { enabled, until: f.maintenance_until || null, message: null } });
    setConfirmMaint(false);
    onSaved();
  };

  return (
    <>
      <PageTitle title="Settings" actions={<Button onClick={save}>Save</Button>} />
      {msg ? <p role="status" className="mb-md">{msg}</p> : null}
      <div className="grid grid-cols-2 gap-lg">
        <Card className="flex flex-col gap-md">
          <h2 className="font-heading text-xl italic">Login and alerts</h2>
          <Field label="Wrong OTPs before block"><Input inputMode="numeric" value={f.otp_max_failures} onChange={set('otp_max_failures')} /></Field>
          <Field label="Block for (minutes)"><Input inputMode="numeric" value={f.otp_block_minutes} onChange={set('otp_block_minutes')} /></Field>
          <Field label="Hours between arrival alerts at one stop"><Input inputMode="numeric" value={f.arrival_cooldown_hours} onChange={set('arrival_cooldown_hours')} /></Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Quiet hours from (IST hour)"><Input inputMode="numeric" value={f.quiet_start} onChange={set('quiet_start')} /></Field>
            <Field label="Quiet hours until"><Input inputMode="numeric" value={f.quiet_end} onChange={set('quiet_end')} /></Field>
          </div>
        </Card>
        <Card className="flex flex-col gap-md">
          <h2 className="font-heading text-xl italic">App versions and maintenance</h2>
          <Field label="Minimum app version (older apps must update)"><Input value={f.min_app_version} onChange={set('min_app_version')} /></Field>
          <Field label="Latest app version (older apps see an update banner)"><Input value={f.latest_app_version} onChange={set('latest_app_version')} /></Field>
          <Field label="Maintenance: back by (shown to users)"><Input placeholder="6:00 AM" value={f.maintenance_until} onChange={set('maintenance_until')} /></Field>
          {maint.enabled ? (
            <Button variant="secondary" onClick={() => setMaintenance(false)}>Turn off maintenance mode</Button>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmMaint(true)}>Turn on maintenance mode</Button>
          )}
        </Card>
      </div>
      <Confirm open={confirmMaint} title="Turn on maintenance mode?" body="Every buyer and vendor will see the maintenance screen until you turn it off." confirmLabel="Turn on" destructive onCancel={() => setConfirmMaint(false)} onConfirm={() => setMaintenance(true)} />
    </>
  );
}
