import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M5 builds this tab. */
export default function BuyerRequests() {
  return (
    <Screen header={<TopAppBar title="Requests" />}>
      <EmptyState title="Requests" body="Coming in the next build." />
    </Screen>
  );
}
