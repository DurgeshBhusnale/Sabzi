import { router } from 'expo-router';
import { EmptyState, Screen, TopAppBar } from '../../src/ui';

/** Built in M7. */
export default function BuyerRequest() {
  return (
    <Screen header={<TopAppBar onBack={() => router.back()} />}>
      <EmptyState title="Coming soon" />
    </Screen>
  );
}
