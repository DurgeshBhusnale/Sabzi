import { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { BadgeCheck, Phone } from 'lucide-react-native';
import { formatIstTime, formatTimeWindow, REVIEW_TAG_LABELS, statusLabel, type ReviewTag } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, Card, EmptyState, Icon, MenuItemRow, RatingDisplay, ReviewCard, SkeletonBlock, StatusPill, Text, TextInput, VendorCard } from '../../ui';
import type { VendorPage } from './api';
import { menuState, needsSearch } from './homeLogic';
import { publicUrl } from '../../lib/storage';
import { formatIstRelative } from '@sabzi/shared';
import { en } from '../../i18n/en';
import { toCard } from './cards';
import type { HomeVendor } from './types';

export type VendorPageActions = {
  follow: () => void;
  call: () => void;
  openPhoto: () => void;
  seeAllReviews: () => void;
  requestTomorrow: () => void;
  goHome: () => void;
  openVendor: (id: string) => void;
};

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** B-05 body, pure for testing. Never renders a phone number (calls go through get_vendor_phone). */
export function VendorPageView({
  page,
  loading,
  societyName,
  alternatives = [],
  actions,
  coach,
  onCoachDone,
}: {
  page: VendorPage | undefined;
  loading: boolean;
  societyName?: string;
  alternatives?: HomeVendor[];
  actions: VendorPageActions;
  coach?: boolean;
  onCoachDone?: () => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const items = page && page.available ? page.menu?.items : undefined;
  const filtered = useMemo(() => (items ?? []).filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())), [items, q]);

  if (loading || !page) {
    return (
      <View style={{ gap: t.spacing.md }} testID="vendor-loading">
        <SkeletonBlock kind="vendorCard" />
        <SkeletonBlock kind="menuRow" count={4} />
      </View>
    );
  }
  if (!page.available) {
    return <EmptyState illustration="store" title={en.buyer.unavailableTitle} body={societyName ? en.buyer.unavailableBody(societyName) : undefined} actionLabel={en.common.goHome} onAction={actions.goHome} testID="vendor-unavailable" />;
  }
  const v = page.vendor;
  const first = v.display_name.split(' ')[0]!;
  const following = page.following.length > 0;
  const today = page.today;
  const photo = publicUrl('stock-photos', page.menu?.stock_photo_path);
  const ms = menuState(items);
  const pill = today
    ? statusLabel(today.status, { gateName: today.gate_name, windowStart: today.window_start, windowEnd: today.window_end, since: today.status_at })
    : null;
  const isNew = v.rating_count === 0;
  const totalStars = Math.max(1, v.rating_count);
  const topTags = Object.entries(v.tag_counts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <View style={{ gap: t.spacing.md }} testID="vendor-page">
      <Pressable onPress={photo ? actions.openPhoto : undefined} accessibilityRole={photo ? 'imagebutton' : undefined} accessibilityLabel={photo ? en.vendorCard.stockPhoto : en.buyer.noPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: t.radius.photo, backgroundColor: t.colors.surface2 }} />
        ) : (
          <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: t.radius.photo, backgroundColor: t.colors.surface2, alignItems: 'flex-end', justifyContent: 'flex-end', padding: t.spacing.xs }} testID="no-photo">
            <Text variant="caption" color="textMuted">{en.buyer.noPhoto}</Text>
          </View>
        )}
      </Pressable>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'center', marginTop: -t.spacing.xxxl }}>
        <View style={{ borderWidth: 3, borderColor: t.colors.bg, borderRadius: 40 }}>
          <Avatar name={v.display_name} uri={publicUrl('vendor-photos', v.photo_path)} size={64} />
        </View>
      </View>
      <View style={{ gap: t.spacing.xxs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, flexWrap: 'wrap' }}>
          <Text variant="h1">{v.display_name}</Text>
          <Icon icon={BadgeCheck} color="primary" size={20} />
          <Text variant="caption" color="primary">{en.buyer.verified}</Text>
        </View>
        {isNew ? (
          <View style={{ flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' }}>
            <StatusPill status="new" label={en.buyer.newOnSabzi} />
            <Text variant="bodySmall" color="textSecondary">{`${v.vehicle === 'tempo' ? en.vendorCard.tempo : en.vendorCard.thela} · ${en.buyer.noRatingsYet}`}</Text>
          </View>
        ) : (
          <RatingDisplay value={Number(v.avg_rating)} count={v.rating_count} />
        )}
        {pill && today ? <StatusPill status={today.status} label={today.status === 'not_coming' && societyName ? `Not coming to ${societyName} today` : pill} /> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Button label={following ? en.buyer.following : en.buyer.follow} variant={following ? 'secondary' : 'primary'} onPress={actions.follow} testID="follow-button" />
        </View>
        {v.allow_calls ? (
          <View style={{ flex: 1 }}>
            <Button label={en.buyer.call} variant="secondary" icon={Phone} onPress={actions.call} testID="call-button" />
          </View>
        ) : null}
      </View>
      {coach && !following ? (
        <Card style={{ gap: t.spacing.xxs }} testID="coach-mark">
          <Text weight="700">{en.buyer.coachTitle(first)}</Text>
          <Text variant="bodySmall" color="textSecondary">{en.buyer.coachBody}</Text>
          <Button label={en.buyer.gotIt} variant="tertiary" fullWidth={false} onPress={onCoachDone} />
        </Card>
      ) : null}
      <Text variant="bodySmall" color="textSecondary">{v.delivery_available ? en.buyer.homeDelivery : en.buyer.pickupOnly}</Text>

      {today?.status === 'not_coming' ? (
        <Card style={{ gap: t.spacing.xxs }} testID="not-coming-card">
          <Text weight="700">{en.buyer.notComingCard(first, societyName ?? '')}</Text>
          <Text variant="bodySmall" color="textSecondary">{en.buyer.notComingCardBody(formatTimeWindow(today.window_start, today.window_end))}</Text>
        </Card>
      ) : null}
      {today?.status === 'not_coming' && alternatives.length ? (
        <>
          <Text variant="h2">{en.buyer.comingInstead}</Text>
          {alternatives.map((a) => <VendorCard key={a.vendor_id} vendor={toCard(a)} onPress={() => actions.openVendor(a.vendor_id)} />)}
        </>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="h2" accessibilityRole="header">{en.buyer.todaysMenu}</Text>
        {page.menu ? <Text variant="caption" color="textMuted">{en.buyer.updated(formatIstTime(page.menu.updated_at))}</Text> : null}
      </View>
      {today?.status === 'left' && ms === 'ok' ? <Text variant="bodySmall" color="textSecondary">{en.buyer.leftMenuNote}</Text> : null}
      {ms === 'not_posted' ? (
        <EmptyState illustration="crate" title={en.buyer.menuNotPosted(first)} body={en.buyer.menuNotPostedBody} testID="menu-not-posted" />
      ) : (
        <Card style={{ paddingVertical: 0 }}>
          {ms === 'all_sold_out' ? (
            <View style={{ backgroundColor: t.colors.errorTint, borderRadius: t.radius.input, padding: t.spacing.sm, marginTop: t.spacing.sm }} testID="all-sold-out">
              <Text variant="bodySmall" color="error">{en.buyer.allSoldOut}</Text>
            </View>
          ) : null}
          {needsSearch(items) ? <View style={{ paddingTop: t.spacing.sm }}><TextInput kind="search" placeholder={en.buyer.searchMenu} value={q} onChangeText={setQ} testID="menu-search" /></View> : null}
          {filtered.map((i) => (
            <MenuItemRow key={i.item_id} name={i.name} price={Number(i.price)} unit={i.unit} soldOut={i.sold_out} dealPrice={i.deal_price == null ? null : Number(i.deal_price)} />
          ))}
        </Card>
      )}

      <Text variant="h2" accessibilityRole="header">{en.buyer.stopsAndTimings}</Text>
      <Card style={{ gap: t.spacing.xs }}>
        {page.stops.map((s) => (
          <View key={s.stop_id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.sm }}>
            <Text style={{ flex: 1 }}>{`${s.society_name} · ${s.gate_name}`}</Text>
            <Text variant="bodySmall" color={s.skipped_today ? 'error' : 'textSecondary'}>
              {s.skipped_today ? en.vendor.notGoingToday : `${s.days_of_week.length === 7 ? 'Daily' : s.days_of_week.map((d) => DAY[d - 1]).join(' ')} · ${formatTimeWindow(s.window_start, s.window_end)}`}
            </Text>
          </View>
        ))}
      </Card>

      <Text variant="h2" accessibilityRole="header">{en.buyer.ratingsAndReviews}</Text>
      {isNew ? (
        <Text color="textSecondary" testID="no-reviews">{en.buyer.noReviews}</Text>
      ) : (
        <>
          <Card style={{ gap: t.spacing.xs }}>
            <RatingDisplay value={Number(v.avg_rating)} count={v.rating_count} size={20} />
            {[5, 4, 3, 2, 1].map((n) => {
              const c = (v as unknown as Record<string, number>)[`stars_${n}`] ?? 0;
              return (
                <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
                  <Text variant="caption" style={{ width: 24 }}>{`${n}★`}</Text>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: t.colors.surface2 }}>
                    <View style={{ height: 8, borderRadius: 4, width: `${(c / totalStars) * 100}%`, backgroundColor: t.colors.dealAmber }} />
                  </View>
                  <Text variant="caption" color="textSecondary" style={{ width: 32 }}>{String(c)}</Text>
                </View>
              );
            })}
            {topTags.length ? <Text variant="bodySmall" color="textSecondary">{topTags.map(([k, n]) => `${REVIEW_TAG_LABELS[k as ReviewTag] ?? k} (${n})`).join(' · ')}</Text> : null}
          </Card>
          {page.reviews.map((r) => (
            <ReviewCard key={r.id} review={{ id: r.id, reviewerName: r.reviewer_name, societyName: r.society_name, stars: r.stars, tags: r.tags, text: r.text, date: formatIstRelative(r.created_at), vendorReply: r.vendor_reply, vendorName: first }} />
          ))}
          <Button label={en.buyer.seeAllReviews} variant="tertiary" onPress={actions.seeAllReviews} />
        </>
      )}
    </View>
  );
}
