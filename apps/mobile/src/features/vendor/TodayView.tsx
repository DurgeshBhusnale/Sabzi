import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Bell, Camera, ChevronRight, CircleCheck } from 'lucide-react-native';
import { greetingFor, formatIstTime, IST_OFFSET_MINUTES, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, ForestHero, Icon, SectionHeader, SheetBody, Skeleton, SkeletonBlock, StopRow, Text, Eyebrow } from '../../ui';
import { allStopsDone, currentStop, stopPhase, type TodayStop } from './arrival';
import type { DayMenu, MyVendor, VendorStats } from './api';
import { publicUrl } from '../../lib/storage';
import { en } from '../../i18n/en';

export type TodayActions = {
  onSetMenu: () => void;
  onAddPhoto: () => void;
  onOpenLive: () => void;
  onSendDeal: () => void;
  onNotifications?: () => void;
};

const DAY_FMT = (d: Date) => {
  const ist = new Date(d.getTime() + IST_OFFSET_MINUTES * 60000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]}`;
};

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View accessible accessibilityLabel={`${value} ${label}`} style={{ gap: 2 }}>
      <Text variant="body" weight="500" color="onForest" style={{ fontSize: 18 }}>{value}</Text>
      <Text variant="caption" weight="400" color="onForest" style={{ opacity: 0.7 }}>{label}</Text>
    </View>
  );
}

/** v4 white step card: icon, title + caption, link on the right. */
function StepCard({ children, testID, onPress, label }: { children: React.ReactNode; testID: string; onPress?: () => void; label?: string }) {
  const t = useTheme();
  const style = [styles.row, { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.card, padding: t.spacing.md, gap: t.spacing.sm }];
  if (onPress) {
    return (
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [style, pressed ? { opacity: 0.8 } : null]}>
        {children}
      </Pressable>
    );
  }
  return <View testID={testID} style={style}>{children}</View>;
}

/** V-04 Today: forest header (greeting + stats), then step cards, live banner and the stops timeline. Pure view for tests. */
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
  const firstName = name.split(' ')[0] ?? name;
  const hero = (
    <View style={[styles.row, { minHeight: 44, justifyContent: 'space-between' }]}>
      <Text variant="label" color="onForest">{DAY_FMT(now)}</Text>
      {actions.onNotifications ? (
        <Pressable accessibilityRole="button" accessibilityLabel={en.nav.notifications} onPress={actions.onNotifications} style={{ minWidth: 48, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Icon icon={Bell} color="onForest" />
        </Pressable>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View testID="today-loading" style={{ flexGrow: 1 }}>
        <ForestHero>
          {hero}
          <Skeleton width="70%" height={30} />
          <Skeleton width="80%" height={36} />
        </ForestHero>
        <SheetBody>
          <SkeletonBlock kind="list" count={1} />
          <SkeletonBlock kind="menuRow" count={3} />
        </SheetBody>
      </View>
    );
  }
  const live = currentStop(stops ?? [], now);
  const published = !!menu?.publishedAt && (menu?.lines.length ?? 0) > 0;
  const done = allStopsDone(stops ?? [], now);
  const verified = vendor?.status === 'verified';
  const photoUrl = publicUrl('stock-photos', menu?.stockPhotoPath);
  const rating = stats?.rating_count ? Number(stats.avg_rating).toFixed(1) : '–';

  return (
    <View testID="today-view" style={{ flexGrow: 1 }}>
      <ForestHero style={{ paddingBottom: t.spacing.lg }}>
        {hero}
        <Text variant="h1" color="onForest" accessibilityRole="header">{en.vendor.greeting(greetingFor(now), firstName)}</Text>
        <View style={[styles.row, { gap: t.spacing.xl }]}>
          <HeroStat value={String(stats?.followers ?? 0)} label={en.vendor.followers} />
          <HeroStat value={String(stats?.alert_opens_today ?? 0)} label={en.vendor.alertOpensToday} />
          <HeroStat value={rating} label={en.vendor.rating} />
        </View>
      </ForestHero>

      <SheetBody style={{ gap: t.spacing.sm }}>
        {!verified ? <Banner kind="info" message={en.vendor.notVerifiedBanner} actionLabel={en.vendor.call} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="not-verified" /> : null}
        {live ? (
          <Pressable onPress={actions.onOpenLive} accessibilityRole="button" testID="live-banner" style={{ backgroundColor: t.colors.accent, borderRadius: t.radius.card, padding: t.spacing.md, gap: 2 }}>
            <Text variant="label" weight="600" color="onAccent">{en.vendor.liveAt(`${live.societyName}, ${live.gateName}`)}</Text>
            <Text variant="caption" weight="400" color="onAccent" style={{ opacity: 0.85 }}>{en.vendor.since(formatIstTime(live.arrivedAt!), openCount)}</Text>
          </Pressable>
        ) : null}

        {done ? (
          <View testID="done-today" style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.card, padding: t.spacing.lg, gap: t.spacing.sm }}>
            <Text variant="h1" style={{ fontSize: t.type.h1.fontSize - 6, lineHeight: t.type.h1.lineHeight - 6 }}>{en.vendor.doneForToday}</Text>
            <Text variant="bodySmall" color="textSecondary">{en.vendor.doneAsk}</Text>
            <View style={[styles.row, { gap: t.spacing.xs }]}>
              <View style={styles.flex}>
                <Button label={en.vendor.sendADeal} onPress={actions.onSendDeal} />
              </View>
            </View>
          </View>
        ) : null}

        {published ? (
          <StepCard testID="menu-live">
            <Icon icon={CircleCheck} color="accent" filled={false} />
            <View style={styles.flex}>
              <Text variant="label" weight="600">{en.vendor.menuLive(menu!.lines.length)}</Text>
              <Text variant="caption" weight="400" color="textSecondary">{en.vendor.updatedAt(formatIstTime(menu!.updatedAt))}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={actions.onSetMenu} hitSlop={12} style={{ minHeight: 48, justifyContent: 'center' }}>
              <Text variant="label" color="accent">{en.common.edit}</Text>
            </Pressable>
          </StepCard>
        ) : (
          <View testID="step-menu" style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.card, padding: t.spacing.md, gap: t.spacing.sm }}>
            <Eyebrow>{en.vendor.step1}</Eyebrow>
            <Text variant="caption" weight="400" color="textSecondary">{en.vendor.followersWaiting(stats?.followers ?? 0)}</Text>
            <Button size="xl" label={en.vendor.setMenu} onPress={actions.onSetMenu} testID="set-menu" />
          </View>
        )}

        {photoUrl ? (
          <StepCard testID="photo-added">
            <Image source={{ uri: photoUrl }} style={{ width: 56, height: 56, borderRadius: t.radius.tile, backgroundColor: t.colors.surface2 }} />
            <View style={styles.flex}>
              <Text variant="label" weight="600">{en.vendor.photoAdded}</Text>
              {menu?.stockPhotoAt ? <Text variant="caption" weight="400" color="textSecondary">{formatIstTime(menu.stockPhotoAt)}</Text> : null}
            </View>
            <Pressable accessibilityRole="button" onPress={actions.onAddPhoto} hitSlop={12} style={{ minHeight: 48, justifyContent: 'center' }}>
              <Text variant="label" color="accent">{en.vendor.change}</Text>
            </Pressable>
          </StepCard>
        ) : (
          <StepCard testID="step-photo" onPress={actions.onAddPhoto} label={`${en.vendor.addTodaysPhoto}. ${en.vendor.photoTrust}`}>
            <Icon icon={Camera} />
            <View style={styles.flex}>
              <Text variant="label" weight="600">{en.vendor.addTodaysPhoto}</Text>
              <Text variant="caption" weight="400" color="textSecondary">{en.vendor.photoTrust}</Text>
            </View>
            <Icon icon={ChevronRight} size={18} color="textSecondary" />
          </StepCard>
        )}

        <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
          <SectionHeader title={en.vendor.todaysStops} />
          {(stops ?? []).length === 0 ? (
            <Text variant="bodySmall" color="textSecondary">{en.vendor.noStopsToday}</Text>
          ) : (
            <View>
              {stops!.map((s, i) => (
                <StopRow key={s.stopId} society={s.societyName} gate={s.gateName} windowStart={s.windowStart} windowEnd={s.windowEnd} followers={s.followers} state={stopPhase(s, now)} last={i === stops!.length - 1} />
              ))}
            </View>
          )}
        </View>
        <View style={{ height: t.heights.fab + t.spacing.xl }} />
      </SheetBody>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
