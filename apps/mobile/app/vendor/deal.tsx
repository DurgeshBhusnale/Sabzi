import { router } from 'expo-router';
import { EmptyState, Screen, TopAppBar } from '../../src/ui';
import { en } from '../../src/i18n/en';

/** V-11 evening price drop is built in M7. */
export default function EveningDeal() {
  return (
    <Screen header={<TopAppBar title={en.vendor.sendDeal} onBack={() => router.back()} />}>
      <EmptyState illustration="crate" title={en.vendor.sendDeal} />
    </Screen>
  );
}
