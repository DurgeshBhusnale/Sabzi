import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BadgeCheck, BellRing, Hourglass, Phone } from 'lucide-react-native';
import { formatIstRelative, formatIstTime, formatTimeWindow, REVIEW_TAG_LABELS, statusLabel, type ReviewTag } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, EmptyState, Icon, ListRow, MenuItemRow, RatingDisplay, ReviewCard, Section, Sections, Skeleton, SkeletonBlock, StatusPill, Text, TextInput } from '../../ui';
import type { VendorPage } from './api';
import { clockText, LiveVendorCard } from './HomeView';
import { menuState, needsSearch } from './homeLogic';
import { publicUrl } from '../../lib/storage';
import { en } from '../../i18n/en';
import type { HomeVendor } from './types';

export type VendorPageActions = {
  follow: () => void;
  call: () => void;
  openPhoto: () => void;
  seeAllReviews: () => void;
  writeReview?: () => void;
  requestTomorrow: () => void;
  goHome: () => void;
  openVendor: (id: string) => void;
};

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** UX-16: shorter photo so the menu starts above the fold */
const PHOTO_HEIGHT = 160;
const AVATAR = 72;
/** UX-13 (owner decision §6 #3): two latest reviews on this page; the rest, and the bars, on B-09 */
const REVIEWS_ON_PAGE = 2;

const daysText = (days: number[]) => (days.length === 7 ? en.buyer.daily : days.map((d) => DAY[d - 1]).join(' '));

/** UX-10: the one sticky primary action for the vendor page, by state. */
export function vendorPageFooter(page: VendorPage | undefined): 'follow' | 'call' | null {
  if (!page || !page.available) return null;
  if (page.following.length === 0) return 'follow';
  return page.vendor.allow_calls ? 'call' : null;
}

/**
 * B-05 body (UX audit §4), pure for testing. Never renders a phone number (calls go through get_vendor_phone).
 * Order: identity + my stop → (not coming + alternatives) → menu (primary) → Tomorrow → Ratings → Other stops.
 */
export function VendorPageView({
  page,
  loading,
  societyName,
  societyId,
  alternatives = [],
  actions,
  coach,
  onCoachDone,
  topBar,
}: {
  page: VendorPage | undefined;
  loading: boolean;
  societyName?: string;
  /** UX-12: the buyer's society, for "Usually at Gate 1, 8:00–8:45 AM" */
  societyId?: string | null;
  alternatives?: HomeVendor[];
  actions: VendorPageActions;
  coach?: boolean;
  onCoachDone?: () => void;
  /** Round back / overflow buttons laid over the photo */
  topBar?: ReactNode;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const items = page && page.available ? page.menu?.items : undefined;
  const filtered = useMemo(() => (items ?? []).filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())), [items, q]);
  const pad = { paddingHorizontal: t.spacing.screen };

  if (loading || !page) {
    return (
      <View testID="vendor-loading">
        <Skeleton height={PHOTO_HEIGHT} width="100%" />
        {topBar ? <View style={[styles.topBar, { paddingHorizontal: t.spacing.md, paddingTop: t.spacing.xs }]}>{topBar}</View> : null}
        <View style={[pad, { gap: t.spacing.md, marginTop: -AVATAR / 2 }]}>
          <Skeleton width={AVATAR} height={AVATAR} round />
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={14} />
          <SkeletonBlock kind="menuRow" count={4} />
        </View>
      </View>
    );
  }
  if (!page.available) {
    return (
      <View style={[pad, { paddingTop: t.spacing.huge * 2 }]}>
        {topBar ? <View style={[styles.topBar, { paddingHorizontal: t.spacing.md, paddingTop: t.spacing.xs }]}>{topBar}</View> : null}
        <EmptyState illustration="store" title={en.buyer.unavailableTitle} body={societyName ? en.buyer.unavailableBody(societyName) : undefined} actionLabel={en.common.goHome} onAction={actions.goHome} testID="vendor-unavailable" />
      </View>
    );
  }
  const v = page.vendor;
  const first = v.display_name.split(' ')[0]!;
  const following = page.following.length > 0;
  const today = page.today;
  const photo = publicUrl('stock-photos', page.menu?.stock_photo_path);
  const ms = menuState(items);
  const pill = today ? statusLabel(today.status, { gateName: today.gate_name, windowStart: today.window_start, windowEnd: today.window_end, since: today.status_at }) : null;
  const isNew = v.rating_count === 0;
  const topTags = Object.entries(v.tag_counts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const avg = Number(v.avg_rating);
  const myStops = societyId ? page.stops.filter((st) => st.society_id === societyId) : [];
  const myStop = myStops[0] ?? null;
  const otherStops = page.stops.filter((st) => !myStops.includes(st));
  // UX-15: one meta line, delivery included
  const meta = [
    en.buyer.verified,
    ...(isNew ? [] : [`${avg.toFixed(1)} ★`, en.buyer.ratingsCount(v.rating_count)]),
    v.vehicle === 'tempo' ? en.vendorCard.tempo : en.vendorCard.thela,
    v.delivery_available ? en.buyer.homeDeliveryShort : en.buyer.pickupOnly,
  ].join(' · ');

  const stopRow = (s: (typeof page.stops)[number], last: boolean) => (
    <ListRow
      key={s.stop_id}
      title={`${s.society_name} · ${s.gate_name}`}
      subtitle={s.skipped_today ? en.vendor.notGoingToday : `${daysText(s.days_of_week)} · ${formatTimeWindow(s.window_start, s.window_end)}`}
      subtitleColor={s.skipped_today ? 'error' : 'textSecondary'}
      left={<Text variant="price" style={{ width: t.layout.minTouch + t.spacing.xxs }}>{clockText(s.window_start).replace(/ (AM|PM)$/, '')}</Text>}
      last={last}
    />
  );

  return (
    <View testID="vendor-page">
      {photo ? (
        <Pressable onPress={actions.openPhoto} accessibilityRole="imagebutton" accessibilityLabel={en.vendorCard.stockPhoto}>
          <Image source={{ uri: photo }} style={{ width: '100%', height: PHOTO_HEIGHT, backgroundColor: t.colors.surface2 }} />
        </Pressable>
      ) : (
        // UX-16: no grey block without a photo; just room for the round back button
        <View style={{ height: t.layout.topAppBar }} testID="no-photo" />
      )}
      {topBar ? <View style={[styles.topBar, { paddingHorizontal: t.spacing.md, paddingTop: t.spacing.xs }]}>{topBar}</View> : null}

      <View style={[pad, { gap: t.spacing.md, marginTop: photo ? -AVATAR / 2 : 0 }]}>
        <View style={{ width: AVATAR + 6, borderWidth: 3, borderColor: t.colors.bg, borderRadius: AVATAR }}>
          <Avatar name={v.display_name} uri={publicUrl('vendor-photos', v.photo_path)} size={AVATAR} />
        </View>
        <View style={{ gap: t.spacing.xxs }}>
          <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]}>
            <Text variant="h1" accessibilityRole="header">{v.display_name}</Text>
            <Icon icon={BadgeCheck} color="accent" size={20} />
          </View>
          {isNew ? <StatusPill status="new" label={en.buyer.newOnSabzi} /> : null}
          <Text variant="bodySmall" color="textSecondary" testID="vendor-meta">{meta}</Text>
          {pill && today ? <StatusPill status={today.status} label={today.status === 'not_coming' && societyName ? `Not coming to ${societyName} today` : pill} /> : null}
          {myStop ? <Text variant="label" testID="my-stop">{en.buyer.usuallyAt(myStop.gate_name, formatTimeWindow(myStop.window_start, myStop.window_end), daysText(myStop.days_of_week))}</Text> : null}
        </View>
        {following || v.allow_calls ? (
          <View style={[styles.row, { gap: t.spacing.xs }]}>
            {following ? (
              <View style={{ flex: 1 }}>
                <Button label={en.buyer.following} icon={BellRing} variant="secondary" onPress={actions.follow} testID="follow-button" />
              </View>
            ) : null}
            {v.allow_calls && !following ? (
              <View style={{ flex: 1 }}>
                <Button label={en.buyer.call} variant="secondary" icon={Phone} onPress={actions.call} testID="call-button" />
              </View>
            ) : null}
          </View>
        ) : null}
        {coach && !following ? (
          <View style={{ backgroundColor: t.colors.forest, borderRadius: t.radius.card, padding: t.spacing.md, gap: t.spacing.xxs }} testID="coach-mark">
            <Text variant="label" color="onForest">{en.buyer.coachTitle(first)}</Text>
            <Text variant="bodySmall" color="onForestMuted">{en.buyer.coachBody}</Text>
            <Pressable onPress={onCoachDone} accessibilityRole="button" hitSlop={12} style={{ alignSelf: 'flex-end', minHeight: t.layout.minTouch, justifyContent: 'center' }}>
              <Text variant="label" color="mint">{en.buyer.gotIt}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[pad, { paddingTop: t.spacing.xl }]}>
        <Sections>
          {today?.status === 'not_coming' ? (
            <View style={{ gap: t.spacing.stackGap }}>
              <View style={{ backgroundColor: t.colors.dealAmberTint, borderRadius: t.radius.button, padding: t.spacing.md, gap: t.spacing.xxs }} testID="not-coming-card">
                <Text variant="label" color="dealAmberText">{en.buyer.notComingCard(first, societyName ?? '')}</Text>
                <Text variant="caption" weight="400" color="dealAmberText">{en.buyer.notComingCardBody(formatTimeWindow(today.window_start, today.window_end))}</Text>
              </View>
              {alternatives.length ? (
                // UX-17: "go here instead" as live cards
                <Section title={en.buyer.comingInstead}>
                  {alternatives.map((a) => (
                    <LiveVendorCard key={a.vendor_id} v={a} onOpen={() => actions.openVendor(a.vendor_id)} />
                  ))}
                </Section>
              ) : null}
            </View>
          ) : null}

          {/* UX-11: the menu is the page's primary section */}
          <Section title={en.buyer.todaysMenu} meta={page.menu ? en.buyer.updated(formatIstTime(page.menu.updated_at)) : undefined} weight="primary" testID="menu-section">
            {today?.status === 'left' && ms === 'ok' ? <Text variant="caption" weight="400" color="textSecondary">{en.buyer.leftMenuNote}</Text> : null}
            {ms === 'not_posted' ? (
              <View style={[styles.row, { gap: t.spacing.sm }]} testID="menu-not-posted">
                <Icon icon={Hourglass} size={20} color="textSecondary" />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{today?.status === 'not_coming' ? en.buyer.notComingMenu : en.buyer.menuNotPosted(first)}</Text>
                  <Text variant="caption" weight="400" color="textSecondary">{en.buyer.menuNotPostedBody}</Text>
                </View>
              </View>
            ) : (
              <View>
                {ms === 'all_sold_out' ? (
                  <View style={{ backgroundColor: t.colors.errorTint, borderRadius: t.radius.input, padding: t.spacing.sm }} testID="all-sold-out">
                    <Text variant="bodySmall" color="onErrorTint">{en.buyer.allSoldOut}</Text>
                  </View>
                ) : null}
                {needsSearch(items) ? <View style={{ paddingTop: t.spacing.sm }}><TextInput kind="search" placeholder={en.buyer.searchMenu} value={q} onChangeText={setQ} testID="menu-search" /></View> : null}
                {filtered.map((i, idx) => (
                  <MenuItemRow key={i.item_id} name={i.name} price={Number(i.price)} unit={i.unit} soldOut={i.sold_out} dealPrice={i.deal_price == null ? null : Number(i.deal_price)} last={idx === filtered.length - 1} />
                ))}
              </View>
            )}
          </Section>

          {/* UX-10 / UX-15: request for tomorrow is a secondary action in its own section */}
          <Section title={en.buyer.tomorrowTitle} testID="tomorrow-section">
            <Text variant="bodySmall" color="textSecondary">{en.buyer.tomorrowBody}</Text>
            <Button label={en.buyer.requestTomorrow} variant="secondary" onPress={actions.requestTomorrow} testID="request-tomorrow-section" />
          </Section>

          <Section
            title={en.buyer.ratingsAndReviews}
            action={following && actions.writeReview ? { label: en.buyer.rateName(first), onPress: actions.writeReview } : undefined}
            testID="ratings-section"
          >
            {!following ? <Text variant="caption" color="textMuted" testID="rate-hint">{en.buyer.rateAfterFollow}</Text> : null}
            {isNew ? (
              <Text variant="bodySmall" color="textSecondary" testID="no-reviews">{en.buyer.noReviews}</Text>
            ) : (
              <>
                {/* UX-13 (owner decision §6 #3): compact summary row; the bar breakdown is on B-09 */}
                <View style={[styles.row, { gap: t.spacing.xs }]} testID="rating-summary">
                  <Text variant="cardTitle">{avg.toFixed(1)}</Text>
                  <RatingDisplay value={avg} size={14} hideNumber />
                  <Text variant="caption" weight="400" color="textSecondary">{en.buyer.ratingsCount(v.rating_count)}</Text>
                </View>
                {topTags.length ? (
                  <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]}>
                    {topTags.map(([k, n]) => (
                      <View key={k} style={{ backgroundColor: t.colors.primaryTint, borderRadius: t.radius.pill, paddingHorizontal: t.spacing.sm, minHeight: 24, justifyContent: 'center' }}>
                        <Text variant="caption" color="onPrimaryTint">{`${REVIEW_TAG_LABELS[k as ReviewTag] ?? k} · ${n}`}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View>
                  {page.reviews.slice(0, REVIEWS_ON_PAGE).map((r) => (
                    <ReviewCard key={r.id} review={{ id: r.id, reviewerName: r.reviewer_name, societyName: r.society_name, stars: r.stars, tags: r.tags, text: r.text, date: formatIstRelative(r.created_at), vendorReply: r.vendor_reply, vendorName: first }} />
                  ))}
                </View>
                <Button label={en.buyer.seeAllCount(v.rating_count)} variant="tertiary" onPress={actions.seeAllReviews} testID="see-all-reviews" />
              </>
            )}
          </Section>

          {/* UX-12: my stop is in the header; every other stop is collapsed at the end */}
          {otherStops.length ? (
            <Section title={myStop ? en.buyer.otherStops : en.buyer.stopsAndTimings} count={otherStops.length} weight="tertiary" defaultOpen={!myStop} testID="other-stops">
              <View>{otherStops.map((s, i) => stopRow(s, i === otherStops.length - 1))}</View>
            </Section>
          ) : null}
        </Sections>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
});
