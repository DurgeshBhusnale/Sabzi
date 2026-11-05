import { describe, expect, it } from 'vitest';
import { anonClient, emailPasswordLogin, phoneLogin } from './client.ts';
import { totp } from './totp.ts';

/** M9 acceptance: verifying a vendor in the admin panel makes him visible to buyers. */
describe('admin verify → buyer visibility', () => {
  it('needs 2-step login, then verifying Ganesh shows him to buyers', async () => {
    const admin = await emailPasswordLogin('field@sabzi.example', 'sabzi-field-dev');

    // Password alone is not enough (aal1)
    const pre = await admin.rpc('verify_vendor', { p_vendor_id: '10000000-0000-4000-8000-000000000004' });
    expect(pre.error?.message).toBe('admin_only');

    // Enroll TOTP (first login) or reuse the factor from an earlier run
    const factors = await admin.auth.mfa.listFactors();
    for (const f of factors.data?.all ?? []) if (f.status !== 'verified') await admin.auth.mfa.unenroll({ factorId: f.id });
    let factorId = factors.data?.totp?.find((f) => f.status === 'verified')?.id;
    let secret = process.env.FIELD_TOTP_SECRET;
    if (!factorId) {
      const e = await admin.auth.mfa.enroll({ factorType: 'totp', friendlyName: `test-${Date.now()}` });
      expect(e.error).toBeNull();
      factorId = e.data!.id;
      secret = e.data!.totp.secret;
    }
    if (!secret) return; // factor from an earlier run without its secret: skip (run after `supabase db reset`)
    const v = await admin.auth.mfa.challengeAndVerify({ factorId, code: totp(secret) });
    expect(v.error).toBeNull();

    const buyer = await phoneLogin('+919999900011');
    const before = await buyer.from('v_vendor_public').select('id').eq('id', '10000000-0000-4000-8000-000000000004');
    expect(before.data).toHaveLength(0);

    const r = await admin.rpc('verify_vendor', { p_vendor_id: '10000000-0000-4000-8000-000000000004' });
    expect(r.error).toBeNull();

    const after = await buyer.from('v_vendor_public').select('id, display_name').eq('id', '10000000-0000-4000-8000-000000000004');
    expect(after.data).toEqual([{ id: '10000000-0000-4000-8000-000000000004', display_name: 'Ganesh Bhaji Wala' }]);

    // put him back to pending so the test can run again
    await admin.rpc('set_vendor_status', { p_vendor_id: '10000000-0000-4000-8000-000000000004', p_status: 'needs_info', p_reason: 'test reset' });
    void anonClient;
  });
});
