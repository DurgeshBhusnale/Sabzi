import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SystemScreen } from './SystemScreen';
import { en } from '../../i18n/en';

/** TECH-03: shown instead of the app when the bundle has no (or a local) Supabase URL. */
export function MisconfiguredBuild() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return <SystemScreen illustration="lock" title={en.system.misconfiguredTitle} body={en.system.misconfiguredBody} testID="misconfigured" />;
}
