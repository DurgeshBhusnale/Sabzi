import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { formatIstTime, formatPriceCompact, parseClock } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, EmptyState, SkeletonBlock, Text, VendorCard } from '../../ui';
import { homeSections } from './homeLogic';
import { toCard } from './cards';
import type { HomeVendor } from './types';
import { en } from '../../i18n/en';

/** "08:00:00" → "8:00 AM" */
export const clockText = (hhmm: string) => {
  const m = parseClock(hhmm);
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export type HomeActions = {
  openVendor: (id: string) => void;
  openDeals: () => void;
  requestTomorrow: () => void;
  tellUs: () => void;
  switchSociety: () => void;
};

/** B-03 Home body. Pure so each state is testable. */
export function HomeView({ vendors, loading, now = new Date(), actions }: { vendors: HomeVendor[] | undefined; loading: boolean; now?: Date; actions: HomeActions }) {
  const t = useTheme();
  const [showNotComing, setShowNotComing] = useState(false);
  if (loading || !vendors) {
    return (
      <View style={{ gap: t.spacing.md }} testID="home-loading">
        <SkeletonBlock kind="vendorCard" />
        <SkeletonBlock kind="vendorCard" count={2} />
      </View>
    );
  }
  const s = homeSections(vendors, now);
  if (s.empty) {
    return <EmptyState illustration="store" title={en.buyer.noVendorsTitle} body={en.buyer.noVendorsBody} actionLabel={en.buyer.tellUs} onAction={actions.tellUs} secondaryLabel={en.buyer.switchSociety} onSecondary={actions.switchSociety} testID="home-empty" />;
  }
  const dealLine = s.deals
    .slice(0, 2)
    .map((d) => d.items.slice(0, 2).map((i) => `${i.name} ${formatPriceCompact(Number(i.deal_price), i.unit)}`).join(' · ') + ` from ${d.vendor.display_name.split(' ')[0]}`)
    .join(' · ');

  return (
    <View style={{ gap: t.spacing.md }} testID="home-view">
      {s.showDeals ? (
        <Pressable onPress={actions.openDeals} accessibilityRole="button" testID="deals-strip">
          <Card tint="amber" style={{ gap: t.spacing.xxs }}>
            <Text weight="700" color="dealAmberText">{en.buyer.dealsCount(s.deals.length)}</Text>
            <Text variant="bodySmall" color="dealAmberText">{dealLine}</Text>
            <Text variant="bodySmall" weight="600" color="dealAmberText" style={{ textDecorationLine: 'underline' }}>{en.buyer.seeDeals}</Text>
          </Card>
        </Pressable>
      ) : null}

      {s.allLeft ? (
        <>
          <EmptyState
            illustration="tempo"
            title={en.buyer.allLeftTitle}
            body={s.left[0] ? en.buyer.allLeftBody(s.left[0].display_name.split(' ')[0]!, clockText(s.left[0].window_start)) : undefined}
            actionLabel={en.buyer.requestTomorrow}
            onAction={actions.requestTomorrow}
            secondaryLabel={s.deals.length ? en.buyer.seeEveningDeals : undefined}
            onSecondary={actions.openDeals}
            testID="all-left"
          />
          <Text variant="h2">{en.buyer.leftToday}</Text>
          {s.left.map((v) => <VendorCard key={v.vendor_id} vendor={toCard(v)} onPress={() => actions.openVendor(v.vendor_id)} />)}
        </>
      ) : (
        <>
          {s.atGate.length ? (
            <>
              <Text variant="h2" accessibilityRole="header">{en.buyer.atGateNow}</Text>
              {s.atGate.map((v) => (
                <VendorCard key={v.vendor_id} vendor={toCard(v)} size="large" onViewMenu={() => actions.openVendor(v.vendor_id)} />
              ))}
            </>
          ) : s.nobodyAtGate ? (
            <Card style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'center' }} testID="nobody-at-gate">
              <Text style={{ flex: 1 }}>
                {s.nextExpected ? en.buyer.nobodyAtGate(s.nextExpected.display_name.split(' ')[0]!, clockText(s.nextExpected.window_start)) : en.buyer.nobodyAtGateNoNext}
              </Text>
            </Card>
          ) : null}
          {s.comingToday.length ? (
            <>
              <Text variant="h2" accessibilityRole="header">{en.buyer.comingToday}</Text>
              {s.comingToday.map((v) => <VendorCard key={v.vendor_id} vendor={toCard(v)} onPress={() => actions.openVendor(v.vendor_id)} />)}
            </>
          ) : null}
          {s.left.length ? (
            <>
              <Text variant="h2">{en.buyer.leftToday}</Text>
              {s.left.map((v) => <VendorCard key={v.vendor_id} vendor={toCard(v)} onPress={() => actions.openVendor(v.vendor_id)} />)}
            </>
          ) : null}
        </>
      )}
      {s.notComing.length ? (
        <View style={{ gap: t.spacing.xs }}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showNotComing }} onPress={() => setShowNotComing(!showNotComing)} style={{ minHeight: t.layout.minTouch, justifyContent: 'center' }} testID="not-coming-toggle">
            <Text weight="600" color="textSecondary">{en.buyer.notComingToday(s.notComing.length)}</Text>
          </Pressable>
          {showNotComing ? s.notComing.map((v) => <VendorCard key={v.vendor_id} vendor={toCard(v)} onPress={() => actions.openVendor(v.vendor_id)} />) : null}
        </View>
      ) : null}
      {s.atGate[0]?.status_at ? <Text variant="caption" color="textMuted">{`Updated ${formatIstTime(now)}`}</Text> : null}
    </View>
  );
}
