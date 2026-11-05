import { Image, Linking, Pressable, View } from 'react-native';
import { greetingFor, formatIstTime, IST_OFFSET_MINUTES, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Banner, Button, Card, PhotoUploader, SkeletonBlock, StatTile, StopRow, Text } from '../../ui';
import { allStopsDone, currentStop, stopPhase, type TodayStop } from './arrival';
import type { DayMenu, MyVendor, VendorStats } from './api';
import { publicUrl } from '../../lib/storage';
import { en } from '../../i18n/en';

export type TodayActions = {
  onSetMenu: () => void;
  onAddPhoto: () => void;
  onOpenLive: () => void;
  onSendDeal: () => void;
};

const DAY_FMT = (d: Date) => {
  const ist = new Date(d.getTime() + IST_OFFSET_MINUTES * 60000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]}`;
};

/** V-04 Today: step cards, live banner, stops timeline, stats strip. Pure view for testing. */
export function TodayView({
  vendor,
  name,
  menu,
  stops,
  stats,
  loading,
  now = new Date(),
  actions,
  openCount = 0,
}: {
  vendor: MyVendor | null | undefined;
  name: string;
  menu: DayMenu | null | undefined;
  stops: TodayStop[] | undefined;
  stats: VendorStats | undefined;
  loading: boolean;
  now?: Date;
  actions: TodayActions;
  openCount?: number;
}) {
  const t = useTheme();
  if (loading) {
    return (
      <View style={{ gap: t.spacing.md }} testID="today-loading">
        <SkeletonBlock kind="list" count={1} />
        <SkeletonBlock kind="vendorCard" count={2} />
        <SkeletonBlock kind="statTile" />
      </View>
    );
  }
  const live = currentStop(stops ?? [], now);
  const published = !!menu?.publishedAt && (menu?.lines.length ?? 0) > 0;
  const done = allStopsDone(stops ?? [], now);
  const firstName = name.split(' ')[0] ?? name;
  const verified = vendor?.status === 'verified';
  const photoUrl = publicUrl('stock-photos', menu?.stockPhotoPath);

  return (
    <View style={{ gap: t.spacing.md }} testID="today-view">
      {!verified ? <Banner kind="info" message={en.vendor.notVerifiedBanner} actionLabel={en.vendor.call} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="not-verified" /> : null}
      {live ? (
        <Pressable onPress={actions.onOpenLive} accessibilityRole="button" testID="live-banner" style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.md }}>
          <Text weight="700" color="onPrimary">{en.vendor.liveAt(`${live.societyName}, ${live.gateName}`)}</Text>
          <Text variant="bodySmall" color="onPrimary">{en.vendor.since(formatIstTime(live.arrivedAt!), openCount)}</Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="h1" accessibilityRole="header">{en.vendor.greeting(greetingFor(now), firstName)}</Text>
          <Text color="textSecondary">{DAY_FMT(now)}</Text>
        </View>
        <Avatar name={vendor?.display_name ?? name} uri={publicUrl('vendor-photos', vendor?.photo_path)} size={48} />
      </View>

      {published ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center' }} testID="menu-live">
          <View style={{ flex: 1 }}>
            <Text weight="700">{en.vendor.menuLive(menu!.lines.length)}</Text>
            <Text variant="bodySmall" color="textSecondary">{en.vendor.updatedAt(formatIstTime(menu!.updatedAt))}</Text>
          </View>
          <Button label={en.common.edit} variant="tertiary" fullWidth={false} onPress={actions.onSetMenu} />
        </Card>
      ) : (
        <Card style={{ gap: t.spacing.sm }} testID="step-menu">
          <Text weight="700">{en.vendor.startDay}</Text>
          <Text variant="bodySmall" color="textSecondary">{en.vendor.followersWaiting(stats?.followers ?? 0)}</Text>
          <Button size="xl" label={en.vendor.setMenu} onPress={actions.onSetMenu} testID="set-menu" />
        </Card>
      )}

      {photoUrl ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }} testID="photo-added">
          <Image source={{ uri: photoUrl }} style={{ width: 56, height: 56, borderRadius: t.radius.input, backgroundColor: t.colors.surface2 }} />
          <View style={{ flex: 1 }}>
            <Text weight="600">{en.vendor.photoAdded}</Text>
            {menu?.stockPhotoAt ? <Text variant="caption" color="textSecondary">{formatIstTime(menu.stockPhotoAt)}</Text> : null}
          </View>
          <Button label={en.vendor.retake} variant="tertiary" fullWidth={false} onPress={actions.onAddPhoto} />
        </Card>
      ) : (
        <View testID="step-photo">
          <PhotoUploader state="empty" onPress={actions.onAddPhoto} />
          <Text variant="caption" color="textSecondary" align="center">{en.vendor.photoTrust}</Text>
        </View>
      )}

      {done ? (
        <Card tint="amber" style={{ gap: t.spacing.xs }} testID="done-today">
          <Text weight="700">{en.vendor.doneForToday}</Text>
          <Text variant="bodySmall" color="textSecondary">{en.vendor.doneBody}</Text>
          <Button label={en.vendor.sendDeal} variant="secondary" onPress={actions.onSendDeal} />
        </Card>
      ) : null}

      <Text variant="h2">{en.vendor.todaysStops}</Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {(stops ?? []).length === 0 ? (
          <Text color="textSecondary" style={{ padding: t.spacing.md }}>{en.vendor.noStopsToday}</Text>
        ) : (
          stops!.map((s) => (
            <StopRow key={s.stopId} society={s.societyName} gate={s.gateName} windowStart={s.windowStart} windowEnd={s.windowEnd} followers={s.followers} state={stopPhase(s, now)} />
          ))
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        <StatTile value={stats?.followers ?? 0} label={en.vendor.followers} zeroHint={en.vendor.zeroStats} />
        <StatTile value={stats?.alert_opens_today ?? 0} label={en.vendor.alertOpens} zeroHint={en.vendor.sendAlertFirst} />
        <StatTile value={stats?.rating_count ? Number(stats.avg_rating).toFixed(1) : '–'} label={en.vendor.rating} />
      </View>
      <View style={{ height: t.heights.fab + t.spacing.xl }} />
    </View>
  );
}
