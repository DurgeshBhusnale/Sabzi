import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M5 builds this tab. */
export default function BuyerFollowing() {
  return (
    <Screen header={<TopAppBar title="Following" />}>
      <EmptyState title="Following" body="Coming in the next build." />
    </Screen>
  );
}
