import { router } from 'expo-router';
import { SystemScreen } from '../src/features/system/SystemScreen';
import { en } from '../src/i18n/en';

/** X-14 */
export default function NotFound() {
  return <SystemScreen illustration="search" title={en.system.notFound} actionLabel={en.common.goHome} onAction={() => router.replace('/')} testID="x14" />;
}
