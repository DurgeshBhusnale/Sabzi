import type { NotificationRow } from '../buyer/api';
import { notificationTarget } from '../buyer/notificationCopy';

export type Data = Record<string, string | undefined>;

export function targetOf(data: Data) {
  return notificationTarget({ id: data.notification_id ?? '', type: data.type ?? '', payload: data, sent_at: '', opened_at: null } as NotificationRow);
}

export type TapDecision = { kind: 'go' } | { kind: 'pending'; href: string } | { kind: 'ignore' } | { kind: 'wait' };

/**
 * TECH-09: what a notification tap may do right now. Signed out → remember the buyer screen for after login;
 * still loading → wait; a target for the other role (shared device, old token) → ignore.
 */
export function tapDecision(data: Data, s: { status: string; role: string | null | undefined }): TapDecision {
  const t = targetOf(data);
  const vendorTarget = t.pathname.startsWith('/(vendor)') || t.pathname.startsWith('/vendor/');
  if (s.status === 'signedOut') {
    if (vendorTarget) return { kind: 'ignore' };
    const path = t.pathname.replace('[id]', t.params?.id ?? '');
    const q = t.params?.society ? `?society=${encodeURIComponent(t.params.society)}` : '';
    return { kind: 'pending', href: `${path}${q}` };
  }
  if (s.status !== 'signedIn') return { kind: 'wait' };
  if ((s.role === 'vendor') !== vendorTarget) return { kind: 'ignore' };
  return { kind: 'go' };
}
