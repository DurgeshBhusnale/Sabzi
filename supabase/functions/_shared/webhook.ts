/**
 * Standard Webhooks signature check used by Supabase Auth HTTP hooks.
 * Secret format: "v1,whsec_<base64>". Signed content: `${id}.${timestamp}.${body}`.
 */
function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64encode(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hmac(secret: string, content: string): Promise<string> {
  const raw = secret.replace(/^v1,/, '').replace(/^whsec_/, '');
  const key = await crypto.subtle.importKey('raw', b64decode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64encode(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(content)));
}

export async function signWebhook(secret: string, id: string, timestamp: string, body: string): Promise<string> {
  return `v1,${await hmac(secret, `${id}.${timestamp}.${body}`)}`;
}

export async function verifyWebhook(
  secret: string,
  headers: Headers,
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigs = headers.get('webhook-signature');
  if (!id || !ts || !sigs) return false;
  if (Math.abs(nowSeconds - Number(ts)) > 300) return false;
  const expected = await signWebhook(secret, id, ts, body);
  return sigs.split(' ').some((s) => s === expected);
}
