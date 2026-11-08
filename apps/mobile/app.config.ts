import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Builds on app.json. The App Links host follows EXPO_PUBLIC_BASE_URL so the testing subdomain and the
 * launch domain need no code change (set it in EAS environment variables).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = process.env.EXPO_PUBLIC_BASE_URL ?? 'https://pheri.anchorlit.in';
  const host = new URL(base).host;
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
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
