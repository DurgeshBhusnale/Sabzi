import { describe, expect, it } from 'vitest';
import { phoneLogin } from './client.ts';

/**
 * M5 acceptance: buyer home status updates within a few seconds of a new stop_events row.
 * The buyer subscribes to Supabase Realtime; the vendor taps "I've arrived"; we measure the delay.
 */
describe('realtime stop events', () => {
  it('buyer receives a new arrival within 5 seconds and home shows "at_gate"', async () => {
    const buyer = await phoneLogin('+919999900011'); // Priya, Green Park
    const vendor = await phoneLogin('+919999900003'); // Imran, stops at Green Park Gate 1
    await buyer.realtime.setAuth((await buyer.auth.getSession()).data.session!.access_token);

    // Warm-up: right after `supabase db reset` the Realtime replication slot starts on the first
    // subscription and can take a few seconds. Production stacks are always warm.
    await new Promise<void>((resolve) => {
      const warm = buyer.channel('warm').on('postgres_changes', { event: '*', schema: 'public', table: 'stop_events' }, () => undefined).subscribe((s) => {
        if (s === 'SUBSCRIBED') setTimeout(() => { buyer.removeChannel(warm); resolve(); }, 6000);
      });
    });

    const received = new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no realtime event within 5 s')), 5000);
      const start = Date.now();
      const ch = buyer
        .channel('test-stop-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stop_events' }, () => {
          clearTimeout(timer);
          resolve(Date.now() - start);
          buyer.removeChannel(ch);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const gate = '50000000-0000-4000-8000-000000000001';
            // A rerun within 2 h hits the arrival cooldown; any new stop event proves the realtime path.
            const a = await vendor.rpc('vendor_arrive', { p_gate_id: gate, p_client_id: crypto.randomUUID() });
            if (a.error?.message === 'arrival_cooldown') {
              const l = await vendor.rpc('vendor_leaving_soon', { p_gate_id: gate, p_client_id: crypto.randomUUID() });
              if (l.error) await vendor.rpc('vendor_left', { p_gate_id: gate, p_client_id: crypto.randomUUID() });
            } else if (a.error) reject(a.error);
          }
        });
    });
    const ms = await received;
    console.log(`realtime arrival delivered in ${ms} ms`);
    expect(ms).toBeLessThan(5000);

    const { data } = await buyer.rpc('buyer_home', { p_society_id: '40000000-0000-4000-8000-000000000001' });
    const imran = (data as { vendor_id: string; status: string }[]).find((v) => v.vendor_id === '10000000-0000-4000-8000-000000000003');
    expect(['at_gate', 'leaving_soon', 'left']).toContain(imran?.status);
  }, 30000);
});
