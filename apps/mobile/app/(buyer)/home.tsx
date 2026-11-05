import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M5 builds this tab. */
export default function BuyerHome() {
  return (
    <Screen header={<TopAppBar title="Home" />}>
      <EmptyState title="Home" body="Coming in the next build." />
    </Screen>
  );
}
