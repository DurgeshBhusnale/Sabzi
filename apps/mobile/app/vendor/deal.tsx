import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Icon, Screen, SkeletonBlock, Text, TopAppBar } from '../../src/ui';
import { DealComposer } from '../../src/features/engagement/DealComposer';
import { myDealToday, sendDeal } from '../../src/features/engagement/api';
import { useMyVendor, useStopsToday, useTodayMenu, useInvalidateVendor, vendorKeys } from '../../src/features/vendor/hooks';
import { remainingFollowers } from '../../src/features/vendor/arrival';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** V-11 */
export default function EveningDeal() {
  const t = useTheme();
  const vendor = useMyVendor();
  const menu = useTodayMenu();
  const stops = useStopsToday();
  const invalidate = useInvalidateVendor();
  const used = useQuery({ queryKey: ['vendor', 'deal-today'], queryFn: () => myDealToday() });
  const [sent, setSent] = useState<{ followers: number; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const remaining = remainingFollowers(stops.data ?? []);
  const loading = menu.isLoading || stops.isLoading || used.isLoading;

  if (sent) {
    return (
      <Screen header={<TopAppBar title={en.eng.dealTitle} />}>
        <View style={{ alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.huge }} testID="deal-sent">
          <Icon icon={CheckCircle2} size={80} color="dealAmber" />
          <Text variant="h1" align="center">{en.eng.dealSent(sent.followers)}</Text>
          <Text color="textSecondary" align="center">{sent.summary}</Text>
        </View>
        <Button size="xl" label={en.eng.backToToday} onPress={() => router.replace('/(vendor)/today')} />
      </Screen>
    );
  }
  return (
    <Screen header={<TopAppBar title={en.eng.dealTitle} onBack={() => router.back()} />}>
      {loading ? (
        <SkeletonBlock kind="menuRow" count={4} />
      ) : (
        <DealComposer
          vendorName={vendor.data?.display_name ?? ''}
          lines={(menu.data?.lines ?? []).map((l) => ({ itemId: l.itemId, name: l.name, price: l.price, unit: l.unit, soldOut: !!l.soldOut }))}
          remainingFollowers={remaining}
          alreadySentAt={used.data?.sent_at ?? null}
          hasRemainingStops={remaining > 0 || (stops.data ?? []).some((s) => !s.skipped && !s.leftAt)}
          onBack={() => router.replace('/(vendor)/today')}
          onSend={async (items) => {
            setError(null);
            try {
              const r = await sendDeal(items);
              track('deal_sent', { items: items.length });
              await invalidate(vendorKeys.today, ['vendor', 'deal-today']);
              const names = (menu.data?.lines ?? []).filter((l) => items.some((i) => i.item_id === l.itemId)).map((l) => `${l.name} ₹${items.find((i) => i.item_id === l.itemId)!.deal_price}`);
              setSent({ followers: r.followers, summary: names.join(' · ') });
            } catch (e) {
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
              used.refetch();
            }
          }}
        />
      )}
      {error ? <Text color="error">{error}</Text> : null}
    </Screen>
  );
}
