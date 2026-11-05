import { router } from 'expo-router';
import { useState } from 'react';
import { BottomSheet, Button, EmptyState, Screen, SkeletonBlock, Text, TopAppBar } from '../../src/ui';
import { SoldOutList } from '../../src/features/vendor/SoldOutList';
import { useSoldOut, useStopsToday, useTodayMenu, useInvalidateVendor, vendorKeys } from '../../src/features/vendor/hooks';
import { skipStop } from '../../src/features/vendor/api';
import { stopPhase } from '../../src/features/vendor/arrival';
import { en } from '../../src/i18n/en';

/** V-10: some sold out; all sold out → "Mark today as done". */
export default function MarkSoldOut() {
  const menu = useTodayMenu();
  const stops = useStopsToday();
  const sold = useSoldOut();
  const invalidate = useInvalidateVendor();
  const [dismissed, setDismissed] = useState(false);
  const lines = menu.data?.lines ?? [];
  const allSold = lines.length > 0 && lines.every((l) => l.soldOut);
  const remaining = (stops.data ?? []).filter((s) => stopPhase(s) === 'upcoming');
  const remainingFollowers = remaining.reduce((n, s) => n + s.followers, 0);
  return (
    <Screen header={<TopAppBar title={en.vendor.markSoldOut} onBack={() => router.back()} />}>
      <Text color="textSecondary">{en.vendor.soldOutHelp}</Text>
      {menu.isLoading ? <SkeletonBlock kind="menuRow" count={5} /> : menu.data ? <SoldOutList menu={menu.data} onToggle={(itemId, soldOut) => sold.mutate({ itemId, soldOut })} /> : <EmptyState title={en.vendor.startDay} />}
      <BottomSheet
        visible={allSold && !dismissed}
        onClose={() => setDismissed(true)}
        title={en.vendor.everythingSold}
        footer={
          <>
            <Button
              size="xl"
              label={en.vendor.markDone}
              testID="mark-done"
              onPress={async () => {
                for (const s of remaining) await skipStop(s.stopId).catch(() => undefined);
                await invalidate(vendorKeys.stops);
                router.replace('/(vendor)/today');
              }}
            />
            <Button label={en.vendor.notYet} variant="tertiary" onPress={() => setDismissed(true)} />
          </>
        }
      >
        <Text color="textSecondary">{en.vendor.everythingSoldBody(remainingFollowers)}</Text>
      </BottomSheet>
    </Screen>
  );
}
