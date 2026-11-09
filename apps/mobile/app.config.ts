import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Builds on app.json. The App Links host follows EXPO_PUBLIC_BASE_URL so the testing subdomain and the
 * launch domain need no code change (set it in EAS environment variables).
 *
 * Owner: set GOOGLE_SERVICES_JSON on EAS with
 *   eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = process.env.EXPO_PUBLIC_BASE_URL ?? 'https://pheri.anchorlit.in';
  const host = new URL(base).host;
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      // FCM config for push tokens. On EAS, GOOGLE_SERVICES_JSON is a file environment variable (the
      // file is gitignored); locally, put google-services.json next to this file.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'https', host, pathPrefix: '/v/' },
            { scheme: 'https', host, pathPrefix: '/s/' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  };
};
