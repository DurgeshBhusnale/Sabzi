import { router } from 'expo-router';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { en } from '../../src/i18n/en';

export default function Farewell() {
  return <SystemScreen illustration="handshake" title={en.settings.farewellTitle} body={en.settings.farewellBody} actionLabel={en.common.done} onAction={() => router.replace('/')} testID="farewell" />;
}
