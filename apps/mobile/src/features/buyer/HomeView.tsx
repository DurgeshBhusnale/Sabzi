import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { BadgeCheck, Check, ChevronRight } from 'lucide-react-native';
import { formatAmount, formatIstTime, parseClock, statusLabel, UNIT_LABELS } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, Card, EmptyState, Icon, ListRow, PHOTO_ART, Section, Sections, SheetBody, SkeletonBlock, Text } from '../../ui';
import { publicUrl } from '../../lib/storage';
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
  /** UX-06: opens the vendor page with the follow sheet up */
  follow: (id: string) => void;
  openDeals: () => void;
  /** UX-07: vendor picker → request for tomorrow */
  requestTomorrow: () => void;
  tellUs: () => void;
  switchSociety: () => void;
};

const firstName = (v: HomeVendor) => v.display_name.split(' ')[0]!;
/** UX-05: rating with its count, the trust signal on every vendor card */
export const ratingText = (v: Pick<HomeVendor, 'avg_rating' | 'rating_count'>) =>
  v.rating_count > 0 ? en.buyer.ratingWithCount(Number(v.avg_rating).toFixed(1), v.rating_count) : en.vendorCard.newVendor;

function NameLine({ v, variant = 'label' }: { v: HomeVendor; variant?: 'label' | 'cardTitle' }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { gap: t.spacing.xxs }]}>
      <Text variant={variant} numberOfLines={1} style={{ flexShrink: 1 }}>{v.display_name}</Text>
      <Icon icon={BadgeCheck} size={16} color="accent" />
    </View>
  );
}

/** Coming today / Left / Not coming: time, avatar, name ✓, rating · gate, and a real Follow button (UX-05, UX-06). */
function VendorTimeRow({ v, last, onOpen, onFollow, muted }: { v: HomeVendor; last: boolean; onOpen: () => void; onFollow: () => void; muted?: boolean }) {
  const t = useTheme();
  const sub = [v.status === 'left' ? statusLabel('left', { since: v.status_at }) : ratingText(v), v.gate_name].join(' · ');
  return (
    <ListRow
      testID={`home-row-${v.vendor_id}`}
      title={v.display_name}
      subtitle={sub}
      last={last}
      muted={muted}
      minHeight={t.layout.listRowWithImage + t.spacing.xxs}
      onPress={onOpen}
      accessibilityLabel={`${v.display_name}, ${statusLabel(v.status, { gateName: v.gate_name, windowStart: v.window_start, windowEnd: v.window_end, since: v.status_at })}`}
      left={
        <View style={[styles.row, { gap: t.spacing.sm }]}>
          <Text variant="price" style={{ width: t.layout.minTouch }}>{shortClock(v.window_start)}</Text>
          <Avatar name={v.display_name} uri={publicUrl('vendor-photos', v.photo_path)} size={40} />
        </View>
      }
      right={
        v.is_following ? (
          <View style={[styles.row, { gap: t.spacing.xxs }]} testID={`following-${v.vendor_id}`}>
            <Icon icon={Check} size={16} color="accent" />
            <Text variant="caption" color="textSecondary">{en.buyer.following}</Text>
          </View>
        ) : (
          <Button label={en.buyer.follow} variant="secondary" fullWidth={false} onPress={onFollow} testID={`follow-${v.vendor_id}`} />
        )
      }
    />
  );
}

/** UX-03: one equal live card per vendor at the gate (replaces the single forest hero). */
export function LiveVendorCard({ v, onOpen }: { v: HomeVendor; onOpen: () => void }) {
  const t = useTheme();
  const c = t.colors;
  const label = statusLabel(v.status, { gateName: v.gate_name, windowStart: v.window_start, windowEnd: v.window_end, since: v.status_at });
  const items = topItems(v.menu?.items);
  const prices = items.map((i) => `${i.name.replace(/\s*\(.*\)/, '')} ${formatAmount(Number(i.deal_price ?? i.price))}/${UNIT_LABELS[i.unit]}`).join(' · ');
  return (
    <Pressable
      testID={`vendor-card-large-${v.vendor_id}`}
      accessibilityRole="button"
      accessibilityLabel={`${v.display_name}, ${label}. ${en.vendorCard.viewMenu(v.menu?.items.length ?? 0)}`}
      onPress={onOpen}
      style={({ pressed }) => ({
        minHeight: 96,
        flexDirection: 'row',
        gap: t.spacing.sm,
        padding: t.spacing.md,
        borderRadius: t.radius.card,
        borderWidth: t.layout.cardBorderWidth,
        borderColor: c.border,
        borderLeftWidth: 3,
        borderLeftColor: c.liveEdge,
        backgroundColor: pressed ? c.surface2 : c.surface,
      })}
    >
      <Avatar name={v.display_name} uri={publicUrl('vendor-photos', v.photo_path)} size={48} />
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <NameLine v={v} variant="cardTitle" />
        <Text variant="bodySmall" color="accent" weight="600">{label}</Text>
        <Text variant="caption" color="textSecondary">{[ratingText(v), v.gate_name].join(' · ')}</Text>
        {prices ? <Text variant="bodySmall" numberOfLines={1}>{prices}</Text> : null}
        <Text variant="label" color="primary">{en.vendorCard.viewMenu(v.menu?.items.length ?? 0)}</Text>
      </View>
    </Pressable>
  );
}

/**
 * B-03 Home (UX audit §4): the slim forest top bar carries the society; the body is sections ordered by time of
 * day — evening deals first once live, then who is at the gate, then coming today, left, not coming. Pure for tests.
 */
export function HomeView({
  vendors,
  loading,
  now = new Date(),
  updatedAt,
  actions,
}: {
  vendors: HomeVendor[] | undefined;
  loading: boolean;
  now?: Date;
  /** UX-08: when the data was fetched (react-query dataUpdatedAt) */
  updatedAt?: number;
  actions: HomeActions;
}) {
  const t = useTheme();

  if (loading || !vendors) {
    return (
      <SheetBody>
        <View testID="home-loading" style={{ gap: t.spacing.stackGap }}>
          <SkeletonBlock kind="vendorCard" count={2} />
          <SkeletonBlock kind="menuRow" count={3} />
        </View>
      </SheetBody>
    );
  }

  const s = homeSections(vendors, now);

  if (s.empty) {
    // UX-09: the standard empty-state block on a plain ground
    return (
      <SheetBody>
        <EmptyState
          testID="home-empty"
          illustration="crate"
          title={en.buyer.noVendorsTitle}
          body={en.buyer.noVendorsBody}
          actionLabel={en.buyer.tellUs}
          onAction={actions.tellUs}
          secondaryLabel={en.buyer.pickAnother}
          onSecondary={actions.switchSociety}
        />
      </SheetBody>
    );
  }

  const dealVendors = s.deals.length;
  const dealItems = s.deals.reduce((n, d) => n + d.items.length, 0);
  const rowProps = (v: HomeVendor) => ({ onOpen: () => actions.openVendor(v.vendor_id), onFollow: () => actions.follow(v.vendor_id) });

  return (
    <SheetBody>
      <View testID="home-view">
        <Sections>
          {s.showDeals ? (
            <Pressable onPress={actions.openDeals} accessibilityRole="button" accessibilityLabel={`${en.buyer.eveningDeals}. ${en.buyer.dealsLine(dealItems, dealVendors)}. ${en.buyer.seeDeals}`} testID="deals-strip">
              <ImageBackground source={PHOTO_ART.eveningDeal} resizeMode="cover" imageStyle={{ borderRadius: t.radius.card }} style={[styles.deal, { borderRadius: t.radius.card, padding: t.spacing.md }]}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: t.radius.card, backgroundColor: t.colors.heroScrim }]} />
                <View style={[styles.row, { gap: t.spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="cardTitle" color="onForest">{en.buyer.eveningDeals}</Text>
                    <Text variant="caption" weight="400" color="onForest">{en.buyer.dealsLine(dealItems, dealVendors)}</Text>
                  </View>
                  <Text variant="label" color="onForest">{en.buyer.seeDeals}</Text>
                  <Icon icon={ChevronRight} size={16} color="onForest" />
                </View>
              </ImageBackground>
            </Pressable>
          ) : null}

          {s.atGate.length ? (
            <Section title={en.buyer.atGateNow} meta={s.atGate.length > 1 ? en.buyer.vendorCount(s.atGate.length) : undefined} testID="at-gate">
              {s.atGate.map((v) => (
                <LiveVendorCard key={v.vendor_id} v={v} onOpen={() => actions.openVendor(v.vendor_id)} />
              ))}
            </Section>
          ) : s.allLeft ? (
            <Card testID="all-left" style={{ gap: t.spacing.xs }}>
              <Text variant="cardTitle">{en.buyer.allLeftTitle}</Text>
              {s.left[0] ? <Text variant="bodySmall" color="textSecondary">{en.buyer.allLeftBody(firstName(s.left[0]), clockText(s.left[0].window_start))}</Text> : null}
              <Button label={en.buyer.requestTomorrow} variant="secondary" onPress={actions.requestTomorrow} testID="request-tomorrow-home" />
            </Card>
          ) : (
            <Card testID="nobody-at-gate">
              <Text variant="body" color="textSecondary">
                {s.nextExpected ? en.buyer.nobodyAtGate(firstName(s.nextExpected), clockText(s.nextExpected.window_start)) : en.buyer.nobodyAtGateNoNext}
              </Text>
            </Card>
          )}

          {s.comingToday.length ? (
            <Section title={en.buyer.comingToday} meta={en.buyer.vendorCount(s.comingToday.length)}>
              <View>
                {s.comingToday.map((v, i, a) => (
                  <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} {...rowProps(v)} />
                ))}
              </View>
            </Section>
          ) : null}

          {s.left.length ? (
            <Section title={en.buyer.leftToday}>
              <View>
                {s.left.map((v, i, a) => (
                  <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} muted {...rowProps(v)} />
                ))}
              </View>
            </Section>
          ) : null}

          {s.notComing.length ? (
            <Section title={en.buyer.notComingTitle} count={s.notComing.length} weight="tertiary" testID="not-coming">
              <View>
                {s.notComing.map((v, i, a) => (
                  <VendorTimeRow key={v.vendor_id} v={v} last={i === a.length - 1} muted {...rowProps(v)} />
                ))}
              </View>
            </Section>
          ) : null}

          {updatedAt ? <Text variant="caption" weight="400" color="textMuted" testID="home-updated">{en.buyer.updated(formatIstTime(new Date(updatedAt)))}</Text> : null}
        </Sections>
      </View>
    </SheetBody>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  deal: { minHeight: 96, justifyContent: 'flex-end', overflow: 'hidden' },
});
