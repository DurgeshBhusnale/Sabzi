import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M4 builds this tab. */
export default function VendorToday() {
  return (
    <Screen header={<TopAppBar title="Today" />}>
      <EmptyState title="Today" body="Coming in the next build." />
    </Screen>
  );
}
