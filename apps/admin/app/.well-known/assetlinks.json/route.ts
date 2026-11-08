import { APP_ID } from '@sabzi/shared/constants';

/**
 * Android App Links verification for https://<domain>/v/<code>.
 * Set ANDROID_SHA256_CERT_FINGERPRINTS (comma separated, from `eas credentials`) where the web app is hosted.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: APP_ID, sha256_cert_fingerprints: fingerprints },
    },
  ]);
}
