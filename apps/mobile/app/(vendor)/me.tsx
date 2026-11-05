import { Screen, EmptyState, TopAppBar } from '../../src/ui';

/** Placeholder until M4 builds this tab. */
export default function VendorMe() {
  return (
    <Screen header={<TopAppBar title="Me" />}>
      <EmptyState title="Me" body="Coming in the next build." />
    </Screen>
  );
}
