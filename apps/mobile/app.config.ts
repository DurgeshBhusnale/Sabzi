import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Builds on app.json. The App Links host follows EXPO_PUBLIC_BASE_URL so the testing subdomain and the
 * launch domain need no code change (set it in EAS environment variables).
 */

/**
 * FCM config: the EAS file variable, else a local google-services.json, else none (build still works, no push).
 * Owner: set GOOGLE_SERVICES_JSON on EAS with
 *   eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
 */
export function googleServicesFile(env: Record<string, string | undefined> = process.env, dir: string = __dirname): string | undefined {
  if (env.GOOGLE_SERVICES_JSON) return env.GOOGLE_SERVICES_JSON;
  return existsSync(join(dir, 'google-services.json')) ? './google-services.json' : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const gsf = googleServicesFile();
  const base = process.env.EXPO_PUBLIC_BASE_URL ?? 'https://pheri.anchorlit.in';
  const host = new URL(base).host;
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      // FCM config for push tokens. On EAS, GOOGLE_SERVICES_JSON is a file environment variable (the
      // file is gitignored); locally, put google-services.json next to this file. Without either the build
      // still succeeds (push tokens just won't register), so fresh clones and CI don't break.
      ...(gsf ? { googleServicesFile: gsf } : {}),
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
