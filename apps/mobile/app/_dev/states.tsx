import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Banner, Button, Card, Screen, Text, TopAppBar } from '../../src/ui';
import { X01NoInternet, X05ServerError, X06Timeout, X07SessionExpired, X09LocationDenied, X10CameraDenied, X11ForceUpdate, X13Maintenance, X16OtpLimit } from '../../src/features/system/SystemStates';
import { PendingList } from '../../src/features/system/PendingActions';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { en } from '../../src/i18n/en';

const noop = () => undefined;

/** Every X-xx screen, reachable from the dev menu (BUILD_PLAN M8). */
export const X_SCREENS: { id: string; title: string; render: () => React.ReactElement }[] = [
  { id: 'X-01', title: 'No internet (full screen)', render: () => <X01NoInternet onRetry={noop} /> },
  { id: 'X-02', title: 'Offline banner', render: () => <Screen><Banner kind="offline" message={en.system.offlineBanner('7:12 AM')} testID="x02" /></Screen> },
  { id: 'X-03', title: 'Weak network banner', render: () => <Screen><Banner kind="weak" message={en.system.weak} testID="x03" /></Screen> },
  {
    id: 'X-04',
    title: 'Actions waiting to send',
    render: () => (
      <Screen>
        <Banner kind="pending" message={en.system.pendingChip(2)} actionLabel={en.common.seeAll} testID="x04" />
        <PendingList
          onRetry={noop}
          onConfirm={noop}
          actions={[
            { clientId: '1', kind: 'publish_menu', payload: {}, label: '', createdAt: Date.now() - 600000, status: 'queued', attempts: 0, nextAttemptAt: 0 },
            { clientId: '2', kind: 'set_sold_out', payload: {}, label: '', createdAt: Date.now() - 300000, status: 'sending', attempts: 1, nextAttemptAt: 0 },
            { clientId: '3', kind: 'set_sold_out', payload: {}, label: '', createdAt: Date.now() - 200000, status: 'sent', attempts: 1, nextAttemptAt: 0 },
            { clientId: '4', kind: 'send_deal', payload: {}, label: '', createdAt: Date.now() - 100000, status: 'failed', attempts: 2, nextAttemptAt: 0, lastError: 'network' },
            { clientId: '5', kind: 'vendor_arrive', payload: {}, label: '', createdAt: Date.now() - 40 * 60000, status: 'needs_confirm', attempts: 0, nextAttemptAt: 0 },
          ]}
        />
      </Screen>
    ),
  },
  { id: 'X-05', title: 'Server error', render: () => <X05ServerError onRetry={noop} /> },
  { id: 'X-06', title: 'Request timed out', render: () => <X06Timeout onRetry={noop} /> },
  { id: 'X-07', title: 'Session expired', render: () => <X07SessionExpired onLogin={() => router.push({ pathname: '/(auth)/phone', params: { expired: '1' } })} /> },
  { id: 'X-08', title: 'Notifications blocked', render: () => <Screen><Banner kind="error" message={en.permissions.notifBlockedBuyer} actionLabel={en.common.openSettings} testID="x08" /><Banner kind="error" message={en.permissions.notifBlockedVendor} actionLabel={en.common.openSettings} /></Screen> },
  { id: 'X-09', title: 'Location denied', render: () => <X09LocationDenied role="vendor" onContinue={noop} /> },
  { id: 'X-10', title: 'Camera denied', render: () => <X10CameraDenied onSkip={noop} /> },
  { id: 'X-11', title: 'Force update', render: () => <X11ForceUpdate /> },
  { id: 'X-12', title: 'Optional update', render: () => <Screen><Banner kind="info" message={en.system.optionalUpdate} actionLabel={en.system.update} testID="x12" /></Screen> },
  { id: 'X-13', title: 'Maintenance', render: () => <X13Maintenance until="6:00 AM" /> },
  { id: 'X-14', title: 'Page not found', render: () => <SystemScreen illustration="search" title={en.system.notFound} actionLabel={en.common.goHome} onAction={noop} testID="x14" /> },
  { id: 'X-15', title: 'Vendor account suspended', render: () => <SystemScreen illustration="lock" title={en.vendor.suspendedTitle} actionLabel={en.common.callSupport} onAction={noop} testID="x15" /> },
  { id: 'X-16', title: 'OTP limit reached', render: () => <X16OtpLimit wait="59 min" onEmail={noop} /> },
  { id: 'X-17', title: 'Society outside pilot area', render: () => <SystemScreen illustration="pin" title={en.buyer.notServedTitle('Rohan Leher')} body={en.buyer.notServedBody} actionLabel={en.buyer.notifyMe} onAction={noop} testID="x17" /> },
];

export default function DevStates() {
  const [open, setOpen] = useState<string | null>(null);
  const cur = X_SCREENS.find((x) => x.id === open);
  if (cur) {
    return (
      <View style={{ flex: 1 }}>
        {cur.render()}
        <View style={{ position: 'absolute', top: 40, right: 16 }}>
          <Button label="Close" variant="secondary" fullWidth={false} onPress={() => setOpen(null)} />
        </View>
      </View>
    );
  }
  return (
    <Screen header={<TopAppBar title="System states" onBack={() => router.back()} />}>
      {X_SCREENS.map((x) => (
        <Card key={x.id} onPress={() => setOpen(x.id)} testID={`open-${x.id}`}>
          <Text weight="700">{x.id}</Text>
          <Text color="textSecondary">{x.title}</Text>
        </Card>
      ))}
    </Screen>
  );
}
