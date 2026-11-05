import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M4 builds this tab. */
export default function VendorStops() {
  return (
    <Screen header={<TopAppBar title="Stops" />}>
      <EmptyState title="Stops" body="Coming in the next build." />
    </Screen>
  );
}
