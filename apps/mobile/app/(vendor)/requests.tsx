import { EmptyState, Screen, TopAppBar } from '../../src/ui';
import { en } from '../../src/i18n/en';

/** V-13 is built in M7. */
export default function VendorRequests() {
  return (
    <Screen header={<TopAppBar title={en.nav.vendorTabs.requests} />}>
      <EmptyState illustration="list" title={en.vendor.requestsSoon} />
    </Screen>
  );
}
