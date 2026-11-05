import type { Env } from './http.ts';

/** MSG91 OTP flow with a DLT-registered template (TECH_SPEC §2). */
export function buildMsg91Request(phone: string, otp: string, env: Env): { url: string; init: RequestInit } | null {
  const authKey = env('MSG91_AUTH_KEY');
  const templateId = env('MSG91_TEMPLATE_ID');
  if (!authKey || !templateId) return null;
  const mobile = phone.replace(/\D/g, '');
  return {
    url: 'https://control.msg91.com/api/v5/flow',
    init: {
      method: 'POST',
      headers: { authkey: authKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ template_id: templateId, short_url: '0', recipients: [{ mobiles: mobile, otp }] }),
    },
  };
}
