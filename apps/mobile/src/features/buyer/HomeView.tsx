import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react-native';
import { formatAmount, formatIstTime, parseClock, statusLabel, UNIT_LABELS } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, Eyebrow, ForestHero, Icon, ListRow, PHOTO_ART, SectionHeader, SheetBody, Skeleton, SkeletonBlock, Text } from '../../ui';
import { homeSections, topItems } from './homeLogic';
import type { HomeVendor } from './types';
import { en } from '../../i18n/en';

/** "08:00:00" → "8:00 AM" */
export const clockText = (hhmm: string) => {
  const m = parseClock(hhmm);
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
/** "08:00:00" → "8:00" (time column in v4 rows) */
const shortClock = (hhmm: string) => clockText(hhmm).replace(/ (AM|PM)$/, '');

export type HomeActions = {
  openVendor: (id: string) => void;
  openDeals: () => void;
  requestTomorrow: () => void;
  tellUs: () => void;
  switchSociety: () => void;
};

const firstName = (v: HomeVendor) => v.display_name.split(' ')[0]!;
const ratingText = (v: HomeVendor) => (v.rating_count > 0 ? `${Number(v.avg_rating).toFixed(1)} ★` : en.vendorCard.newVendor);

/** v4 time-led row used for Coming today / Left / Not coming. */
function VendorTimeRow({ v, last, onOpen, muted }: { v: HomeVendor; last: boolean; onOpen: () => void; muted?: boolean }) {
  const t = useTheme();
  const sub = [v.gate_name, v.status === 'left' ? statusLabel('left', { since: v.status_at }) : ratingText(v)].join(' · ');
  return (
    <ListRow
      testID={`home-row-${v.vendor_id}`}
      title={v.display_name}
      subtitle={sub}
      last={last}
      muted={muted}
      minHeight={60}
      onPress={onOpen}
      accessibilityLabel={`${v.display_name}, ${statusLabel(v.status, { gateName: v.gate_name, windowStart: v.window_start, windowEnd: v.window_end, since: v.status_at })}`}
      left={<Text variant="price" style={{ width: 48 }}>{shortClock(v.window_start)}</Text>}
      right={
        v.is_following ? (
          <Icon icon={ChevronRight} size={16} color="textSecondary" />
        ) : (
          <View style={[styles.followPill, { borderColor: t.colors.primary, borderRadius: t.radius.pill }]}>
            <Text variant="caption" weight="600" color="primary">{en.buyer.follow}</Text>
          </View>
        )
      }
    />
  );
}

/** Forest hero for the vendor at the gate: name, gate + time + rating, three prices, View menu. */
function AtGateHero({ v, onOpen }: { v: HomeVendor; onOpen: () => void }) {
  const t = useTheme();
  const label = statusLabel(v.status, { gateName: v.gate_name, windowStart: v.window_start, windowEnd: v.window_end, since: v.status_at });
  const items = topItems(v.menu?.items);
  return (
    <ForestHero testID={`vendor-card-large-${v.vendor_id}`}>
      <Eyebrow live onDark>{v.status === 'leaving_soon' ? label : en.buyer.atGateNow}</Eyebrow>
      <Text variant="display" color="onForest">{v.display_name}</Text>
      <Text variant="bodySmall" color="onForestMuted">{[label, ratingText(v)].join(' · ')}</Text>
      {items.length ? (
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          {items.map((i) => (
            <View key={i.item_id} style={[styles.priceBox, { borderRadius: t.radius.button, paddingHorizontal: t.spacing.sm, paddingVertical: 10 }]}>
              <Text variant="caption" weight="400" color="onForest" style={{ opacity: 0.75 }} numberOfLines={1}>{i.name.replace(/\s*\(.*\)/, '')}</Text>
              <Text variant="body" weight="500" color="onForest" strike={i.sold_out}>
                {formatAmount(Number(i.deal_price ?? i.price))}
                <Text variant="caption" weight="400" color="onForest" style={{ opacity: 0.7 }}>{` /${UNIT_LABELS[i.unit]}`}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Button label={en.vendorCard.viewMenu(v.menu?.items.length ?? 0)} variant="light" onPress={onOpen} />
    </ForestHero>
  );
}

/** B-03 Home: forest hero (who is at the gate) over a cream sheet (coming today, deals, not coming). Pure for tests. */
export function HomeView({ vendors, loading, now = new Date(), actions }: { vendors: HomeVendor[] | undefined; loading: boolean; now?: Date; actions: HomeActions }) {
  const t = useTheme();
  const [showNotComing, setShowNotComing] = useState(false);

  if (loading || !vendors) {
    return (
      <View testID="home-loading" style={{ flexGrow: 1 }}>
        <ForestHero>
          <Skeleton width={120} height={12} />
          <Skeleton width="70%" height={32} />
          <Skeleton width="90%" height={14} />
          <Skeleton height={48} />
        </ForestHero>
        <SheetBody>
          <SkeletonBlock kind="menuRow" count={4} />
        </SheetBody>
      </View>
    );
  }

  const s = homeSections(vendors, now);

  if (s.empty) {
    return (
      <View testID="home-empty" style={{ flexGrow: 1 }}>
        <ForestHero>
          <Eyebrow onDark>{en.buyer.yourSocietyEyebrow}</Eyebrow>
          <Text variant="display" color="onForest">{en.buyer.noVendorsTitle}</Text>
          <Text variant="bodySmall" color="onForestMuted">{en.buyer.noVendorsBody}</Text>
        </ForestHero>
        <SheetBody>
          <Button label={en.buyer.tellUs} onPress={actions.tellUs} />
          <Button label={en.buyer.switchSociety} variant="tertiary" onPress={actions.switchSociety} />
        </SheetBody>
      </View>
    );
  }

  const hero = s.atGate[0];
  const dealVendors = s.deals.length;
  const dealItems = s.deals.reduce((n, d) => n + d.items.length, 0);

  return (
    <View testID="home-view" style={{ flexGrow: 1 }}>
      {hero ? (
        <AtGateHero v={hero} onOpen={() => actions.openVendor(hero.vendor_id)} />
      ) : s.allLeft ? (
        <ForestHero testID="all-left">
          <Eyebrow onDark>{en.buyer.doneForTodayEyebrow}</Eyebrow>
          <Text variant="display" color="onForest">{en.buyer.allLeftTitle}</Text>
          {s.left[0] ? <Text variant="bodySmall" color="onForestMuted">{en.buyer.allLeftBody(firstName(s.left[0]), clockText(s.left[0].window_start))}</Text> : null}
          <View style={{ gap: t.spacing.xs }}>
            {s.deals.length ? <Button label={en.buyer.seeEveningDeals} variant="light" onPress={actions.openDeals} /> : null}
            <Button label={en.buyer.requestTomorrow} variant={s.deals.length ? 'outlineOnDark' : 'light'} onPress={actions.requestTomorrow} />
          </View>
        </ForestHero>
      ) : (
        <ForestHero testID="nobody-at-gate">
          <Eyebrow onDark>{en.buyer.nobodyYetEyebrow}</Eyebrow>
          <Text variant="display" color="onForest">{en.buyer.nobodyYetTitle}</Text>
          <Text variant="bodySmall" color="onForestMuted">
            {s.nextExpected ? en.buyer.nobodyAtGate(firstName(s.nextExpected), clockText(s.nextExpected.window_start)) : en.buyer.nobodyAtGateNoNext}
          </Text>
        </ForestHero>
      )}

      <SheetBody style={{ gap: t.spacing.lg }}>
        {s.atGate.length > 1 ? (
          <View>
            <SectionHeader title={en.buyer.alsoAtGate} right={String(s.atGate.length - 1)} />
            {s.atGate.slice(1).map((v, i, a) => (
              <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} onOpen={() => actions.openVendor(v.vendor_id)} />
            ))}
          </View>
        ) : null}

        {s.showDeals ? (
          <Pressable onPress={actions.openDeals} accessibilityRole="button" accessibilityLabel={`${en.buyer.eveningDeals}. ${en.buyer.dealsLine(dealItems, dealVendors)}. ${en.buyer.seeDeals}`} testID="deals-strip">
            <ImageBackground source={PHOTO_ART.eveningDeal} resizeMode="cover" imageStyle={{ borderRadius: t.radius.card }} style={[styles.deal, { borderRadius: t.radius.card, padding: t.spacing.md }]}>
              <View style={[StyleSheet.absoluteFill, { borderRadius: t.radius.card, backgroundColor: 'rgba(15,61,42,0.55)' }]} />
              <View style={[styles.row, { gap: t.spacing.sm }]}>
                <View style={{ flex: 1 }}>
                  <Text variant="h2" color="onForest">{en.buyer.eveningDeals}</Text>
                  <Text variant="caption" weight="400" color="onForest">{en.buyer.dealsLine(dealItems, dealVendors)}</Text>
                </View>
                <Text variant="caption" weight="600" color="onForest">{en.buyer.seeDeals}</Text>
                <Icon icon={ChevronRight} size={16} color="onForest" />
              </View>
            </ImageBackground>
          </Pressable>
        ) : null}

        {s.comingToday.length ? (
          <View>
            <SectionHeader title={en.buyer.comingToday} right={en.buyer.vendorCount(s.comingToday.length)} />
            {s.comingToday.map((v, i, a) => (
              <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} onOpen={() => actions.openVendor(v.vendor_id)} />
            ))}
          </View>
        ) : null}

        {s.left.length ? (
          <View>
            <SectionHeader title={en.buyer.leftToday} />
            {s.left.map((v, i, a) => (
              <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} muted onOpen={() => actions.openVendor(v.vendor_id)} />
            ))}
          </View>
        ) : null}

        {s.notComing.length ? (
          <View style={{ borderTopWidth: 1, borderTopColor: t.colors.border }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showNotComing }}
              onPress={() => setShowNotComing(!showNotComing)}
              style={[styles.row, { minHeight: t.layout.minTouch, justifyContent: 'space-between' }]}
              testID="not-coming-toggle"
            >
              <Text variant="caption" color="textSecondary" style={{ fontSize: 13 }}>{en.buyer.notComingToday(s.notComing.length)}</Text>
              <Icon icon={showNotComing ? ChevronUp : ChevronDown} size={16} color="textSecondary" />
            </Pressable>
            {showNotComing
              ? s.notComing.map((v, i, a) => <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} muted onOpen={() => actions.openVendor(v.vendor_id)} />)
              : null}
          </View>
        ) : null}

        {hero?.status_at ? <Text variant="caption" weight="400" color="textMuted">{en.buyer.updated(formatIstTime(now))}</Text> : null}
      </SheetBody>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  priceBox: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 2 },
  followPill: { height: 32, paddingHorizontal: 14, borderWidth: 1, justifyContent: 'center' },
  deal: { minHeight: 96, justifyContent: 'flex-end', overflow: 'hidden' },
});
