import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BadgeCheck, BellRing, CameraOff, Hourglass, House, Phone, Store } from 'lucide-react-native';
import { formatIstRelative, formatIstTime, formatTimeWindow, REVIEW_TAG_LABELS, statusLabel, type ReviewTag } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, EmptyState, Icon, ListRow, MenuItemRow, RatingDisplay, ReviewCard, SectionHeader, Skeleton, SkeletonBlock, StatusPill, Text, TextInput } from '../../ui';
import type { VendorPage } from './api';
import { clockText } from './HomeView';
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
const PHOTO_HEIGHT = 200;
const AVATAR = 72;

/** B-05 body, pure for testing. Never renders a phone number (calls go through get_vendor_phone). */
export function VendorPageView({
  page,
  loading,
  societyName,
  alternatives = [],
  actions,
  coach,
  onCoachDone,
  topBar,
}: {
  page: VendorPage | undefined;
  loading: boolean;
  societyName?: string;
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
        {topBar ? <View style={styles.topBar}>{topBar}</View> : null}
        <View style={[pad, { gap: t.spacing.md, marginTop: -AVATAR / 2 }]}>
          <Skeleton width={AVATAR} height={AVATAR} round />
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={14} />
          <Skeleton height={48} />
          <SkeletonBlock kind="menuRow" count={4} />
        </View>
      </View>
    );
  }
  if (!page.available) {
    return (
      <View style={[pad, { paddingTop: t.spacing.huge * 2 }]}>
        {topBar ? <View style={styles.topBar}>{topBar}</View> : null}
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
  const totalStars = Math.max(1, v.rating_count);
  const topTags = Object.entries(v.tag_counts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const avg = Number(v.avg_rating);

  return (
    <View testID="vendor-page">
      <Pressable onPress={photo ? actions.openPhoto : undefined} accessibilityRole={photo ? 'imagebutton' : undefined} accessibilityLabel={photo ? en.vendorCard.stockPhoto : en.buyer.noPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', height: PHOTO_HEIGHT, backgroundColor: t.colors.surface2 }} />
        ) : (
          <View style={{ width: '100%', height: PHOTO_HEIGHT, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center', gap: t.spacing.xs }} testID="no-photo">
            <Icon icon={CameraOff} size={28} color="textSecondary" />
            <Text variant="caption" color="textSecondary">{en.buyer.noPhoto}</Text>
          </View>
        )}
      </Pressable>
      {topBar ? <View style={styles.topBar}>{topBar}</View> : null}

      <View style={[pad, { gap: t.spacing.md, marginTop: -AVATAR / 2 }]}>
        <View style={{ width: AVATAR + 6, borderWidth: 3, borderColor: t.colors.bg, borderRadius: AVATAR }}>
          <Avatar name={v.display_name} uri={publicUrl('vendor-photos', v.photo_path)} size={AVATAR} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={[styles.row, { gap: 10, flexWrap: 'wrap' }]}>
            <Text variant="h1" accessibilityRole="header">{v.display_name}</Text>
            <Icon icon={BadgeCheck} color="accent" size={20} />
          </View>
          {isNew ? (
            <View style={[styles.row, { gap: t.spacing.xs }]}>
              <StatusPill status="new" label={en.buyer.newOnSabzi} />
              <Text variant="bodySmall" color="textSecondary">{`${en.buyer.verified} · ${v.vehicle === 'tempo' ? en.vendorCard.tempo : en.vendorCard.thela}`}</Text>
            </View>
          ) : (
            <Text variant="bodySmall" color="textSecondary">{en.buyer.verifiedLine(avg.toFixed(1), v.rating_count)}</Text>
          )}
          {pill && today ? <StatusPill status={today.status} label={today.status === 'not_coming' && societyName ? `Not coming to ${societyName} today` : pill} /> : null}
        </View>
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <View style={{ flex: 1 }}>
            <Button label={following ? en.buyer.following : en.buyer.follow} icon={following ? BellRing : undefined} variant={following ? 'secondary' : 'primary'} onPress={actions.follow} testID="follow-button" />
          </View>
          {v.allow_calls ? (
            <View style={{ flex: 1 }}>
              <Button label={en.buyer.call} variant="secondary" icon={Phone} onPress={actions.call} testID="call-button" />
            </View>
          ) : null}
        </View>
        {coach && !following ? (
          <View style={{ backgroundColor: t.colors.forest, borderRadius: t.radius.card, padding: t.spacing.md, gap: t.spacing.xxs }} testID="coach-mark">
            <Text variant="label" color="onForest">{en.buyer.coachTitle(first)}</Text>
            <Text variant="bodySmall" color="onForestMuted">{en.buyer.coachBody}</Text>
            <Pressable onPress={onCoachDone} accessibilityRole="button" hitSlop={12} style={{ alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' }}>
              <Text variant="caption" weight="600" color="mint">{en.buyer.gotIt}</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <Icon icon={v.delivery_available ? House : Store} size={16} color="textSecondary" />
          <Text variant="bodySmall" color="textSecondary">{v.delivery_available ? en.buyer.homeDelivery : en.buyer.pickupOnly}</Text>
        </View>
      </View>

      <View style={[pad, { gap: t.spacing.xl, paddingTop: t.spacing.lg }]}>
        {today?.status === 'not_coming' ? (
          <View style={{ gap: t.spacing.xs }}>
            <View style={{ backgroundColor: t.colors.dealAmberTint, borderRadius: t.radius.button, padding: t.spacing.md, gap: t.spacing.xxs }} testID="not-coming-card">
              <Text variant="label" color="dealAmberText">{en.buyer.notComingCard(first, societyName ?? '')}</Text>
              <Text variant="caption" weight="400" color="dealAmberText">{en.buyer.notComingCardBody(formatTimeWindow(today.window_start, today.window_end))}</Text>
            </View>
            {alternatives.length ? (
              <View>
                <SectionHeader title={en.buyer.comingInstead} />
                {alternatives.map((a, i) => (
                  <ListRow key={a.vendor_id} title={a.display_name} subtitle={`${a.gate_name} · ${clockText(a.window_start)}`} last={i === alternatives.length - 1} chevron onPress={() => actions.openVendor(a.vendor_id)} left={<Avatar name={a.display_name} uri={publicUrl('vendor-photos', a.photo_path)} size={36} />} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: t.spacing.xs }}>
          <SectionHeader title={en.buyer.todaysMenu} right={page.menu ? en.buyer.updated(formatIstTime(page.menu.updated_at)) : undefined} />
          {today?.status === 'left' && ms === 'ok' ? <Text variant="caption" weight="400" color="textSecondary">{en.buyer.leftMenuNote}</Text> : null}
          {ms === 'not_posted' ? (
            <View style={[styles.row, { gap: t.spacing.sm, backgroundColor: t.colors.surface2, borderRadius: t.radius.button, padding: t.spacing.md }]} testID="menu-not-posted">
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
        </View>

        <View>
          <SectionHeader title={en.buyer.stopsAndTimings} />
          {page.stops.map((s, i) => (
            <ListRow
              key={s.stop_id}
              title={`${s.society_name} · ${s.gate_name}`}
              subtitle={s.skipped_today ? en.vendor.notGoingToday : `${s.days_of_week.length === 7 ? 'Daily' : s.days_of_week.map((d) => DAY[d - 1]).join(' ')} · ${formatTimeWindow(s.window_start, s.window_end)}`}
              subtitleColor={s.skipped_today ? 'error' : 'textSecondary'}
              left={<Text variant="price" style={{ width: 52 }}>{clockText(s.window_start).replace(/ (AM|PM)$/, '')}</Text>}
              last={i === page.stops.length - 1}
            />
          ))}
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <SectionHeader title={en.buyer.ratingsAndReviews} />
          {isNew ? (
            <>
              <Text variant="bodySmall" color="textSecondary" testID="no-reviews">{en.buyer.noReviews}</Text>
              {following && actions.writeReview ? <Button label={en.eng.writeReview} variant="secondary" onPress={actions.writeReview} /> : null}
            </>
          ) : (
            <>
              <View style={[styles.row, { gap: t.spacing.lg, alignItems: 'flex-start' }]}>
                <View style={{ alignItems: 'flex-start', gap: t.spacing.xxs }}>
                  <Text variant="display" style={{ fontSize: 44, lineHeight: 48 }}>{avg.toFixed(1)}</Text>
                  <RatingDisplay value={avg} size={14} hideNumber />
                  <Text variant="caption" weight="400" color="textSecondary">{en.buyer.ratingsCount(v.rating_count)}</Text>
                </View>
                <View style={{ flex: 1, gap: 4, paddingTop: 6 }}>
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = (v as unknown as Record<string, number>)[`stars_${n}`] ?? 0;
                    return (
                      <View key={n} style={[styles.row, { gap: t.spacing.xs }]}>
                        <Text variant="caption" weight="400" color="textSecondary" style={{ width: 10 }}>{String(n)}</Text>
                        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.colors.surface2 }}>
                          <View style={{ height: 6, borderRadius: 3, width: `${(c / totalStars) * 100}%`, backgroundColor: t.colors.star }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              {topTags.length ? (
                <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]}>
                  {topTags.map(([k, n]) => (
                    <View key={k} style={{ backgroundColor: t.colors.primaryTint, borderRadius: t.radius.pill, paddingHorizontal: 10, minHeight: 24, justifyContent: 'center' }}>
                      <Text variant="caption" color="onPrimaryTint">{`${REVIEW_TAG_LABELS[k as ReviewTag] ?? k} · ${n}`}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View>
                {page.reviews.map((r) => (
                  <ReviewCard key={r.id} review={{ id: r.id, reviewerName: r.reviewer_name, societyName: r.society_name, stars: r.stars, tags: r.tags, text: r.text, date: formatIstRelative(r.created_at), vendorReply: r.vendor_reply, vendorName: first }} />
                ))}
              </View>
              <Button label={en.buyer.seeAllReviews} variant="tertiary" onPress={actions.seeAllReviews} />
              {following && actions.writeReview ? <Button label={en.eng.writeReview} variant="secondary" onPress={actions.writeReview} testID="write-review" /> : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
});
