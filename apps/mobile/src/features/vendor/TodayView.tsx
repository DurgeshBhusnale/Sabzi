import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Camera, CircleCheck, ClipboardList, PackageX, Tag } from 'lucide-react-native';
import { greetingFor, formatIstTime, istHour, IST_OFFSET_MINUTES, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Eyebrow, ForestHero, Icon, Section, Sections, SheetBody, Skeleton, SkeletonBlock, StopRow, Text, type LucideIcon } from '../../ui';
import { allStopsDone, currentStop, stopPhase, type TodayStop } from './arrival';
import type { DayMenu, MyVendor, VendorStats } from './api';
import { publicUrl } from '../../lib/storage';
import { en } from '../../i18n/en';

export type TodayActions = {
  onSetMenu: () => void;
  onAddPhoto: () => void;
  onOpenLive: () => void;
  onSendDeal: () => void;
  /** UX-33 quick actions */
  onSoldOut?: () => void;
  onRequests?: () => void;
  /** UX-32: the full list lives on the Stops tab */
  onAllStops?: () => void;
};

const DAY_FMT = (d: Date) => {
  const ist = new Date(d.getTime() + IST_OFFSET_MINUTES * 60000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]}`;
};

/** Evening deal unlocks after 4 PM IST, or once every stop is done (UX-33). */
const DEAL_FROM_HOUR_IST = 16;

export type NextAction = 'set_menu' | 'live' | 'done' | 'next_stop';

/** UX-31: the one next step for the vendor, by state. Pure for tests. */
export function nextAction(o: { published: boolean; live: boolean; done: boolean }): NextAction {
  if (o.live) return 'live';
  if (!o.published) return 'set_menu';
  if (o.done) return 'done';
  return 'next_stop';
}

/** Checklist row inside the day card: icon, label, optional link on the right. */
function CheckRow({ icon, done, label, sub, link, onPress, testID, last }: { icon: LucideIcon; done: boolean; label: string; sub?: string; link?: string; onPress?: () => void; testID: string; last?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[label, sub, link].filter(Boolean).join('. ')}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { minHeight: t.layout.vendorPrimaryHeight, gap: t.spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.divider }]}
    >
      <Icon icon={done ? CircleCheck : icon} color={done ? 'accent' : 'textSecondary'} />
      <View style={styles.flex}>
        <Text variant="label">{label}</Text>
        {sub ? <Text variant="caption" weight="400" color="textSecondary">{sub}</Text> : null}
      </View>
      {link ? <Text variant="label" color="accent">{link}</Text> : null}
    </Pressable>
  );
}

/** UX-33: 56 dp tile in the quick actions row. */
function QuickTile({ icon, label, onPress, disabled, testID }: { icon: LucideIcon; label: string; onPress?: () => void; disabled?: boolean; testID: string }) {
  const t = useTheme();
  const c = t.colors;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || !onPress }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: t.layout.vendorPrimaryHeight + t.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing.xxs,
        padding: t.spacing.xs,
        borderRadius: t.radius.card,
        borderWidth: t.layout.cardBorderWidth,
        borderColor: c.border,
        backgroundColor: pressed ? c.surface2 : c.surface,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Icon icon={icon} color={disabled ? 'textMuted' : 'primary'} />
      <Text variant="caption" align="center" color={disabled ? 'textMuted' : 'textPrimary'}>{label}</Text>
    </Pressable>
  );
}

/**
 * V-04 Today (UX audit §4): a short header, one Next action card, the day checklist, quick actions, the next stop.
 * Stats stay as a one-line strip under the next action (safe default for UX-30, §6 #2). Pure view for tests.
 */
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
  // UX-43: no bell; Requests has its own tab
  const header = (
    <View style={{ gap: t.spacing.xxs }}>
      <Text variant="label" color="onForestMuted">{DAY_FMT(now)}</Text>
      <Text variant="h1" color="onForest" accessibilityRole="header">{en.vendor.greeting(greetingFor(now), firstName)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View testID="today-loading" style={{ flexGrow: 1 }}>
        <ForestHero>
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={30} />
        </ForestHero>
        <SheetBody>
          <SkeletonBlock kind="list" count={1} />
          <SkeletonBlock kind="menuRow" count={3} />
        </SheetBody>
      </View>
    );
  }
  const all = stops ?? [];
  const live = currentStop(all, now);
  const published = !!menu?.publishedAt && (menu?.lines.length ?? 0) > 0;
  const done = allStopsDone(all, now);
  const verified = vendor?.status === 'verified';
  const photoUrl = publicUrl('stock-photos', menu?.stockPhotoPath);
  const rating = stats?.rating_count ? `${Number(stats.avg_rating).toFixed(1)} ★` : null;
  const doneCount = all.filter((s) => ['done', 'skipped'].includes(stopPhase(s, now))).length;
  const next = all.find((s) => stopPhase(s, now) === 'upcoming') ?? null;
  const action = nextAction({ published, live: !!live, done });
  const dealOpen = done || istHour(now) >= DEAL_FROM_HOUR_IST;
  const statsLine = [en.vendor.followersCount(stats?.followers ?? 0), en.vendor.opensToday(stats?.alert_opens_today ?? 0), rating].filter(Boolean).join(' · ');

  return (
    <View testID="today-view" style={{ flexGrow: 1 }}>
      <ForestHero style={{ paddingBottom: t.spacing.lg }}>{header}</ForestHero>

      <SheetBody>
        <Sections>
          {!verified ? <Banner kind="info" message={en.vendor.notVerifiedBanner} actionLabel={en.vendor.call} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="not-verified" /> : null}

          {/* UX-31: one next-action card */}
          <View style={{ gap: t.spacing.xs }}>
            {action === 'live' && live ? (
              <Pressable onPress={actions.onOpenLive} accessibilityRole="button" testID="live-banner" style={{ backgroundColor: t.colors.accent, borderRadius: t.radius.card, padding: t.spacing.md, gap: t.spacing.xxs, minHeight: t.layout.vendorPrimaryHeight }}>
                <Eyebrow live onDark>{en.vendor.liveAtGate}</Eyebrow>
                <Text variant="cardTitle" color="onAccent">{en.vendor.liveAt(`${live.societyName}, ${live.gateName}`)}</Text>
                <Text variant="caption" weight="400" color="onAccent">{en.vendor.since(formatIstTime(live.arrivedAt!), openCount)}</Text>
              </Pressable>
            ) : action === 'set_menu' ? (
              <Card testID="step-menu" style={{ gap: t.spacing.sm }}>
                <Eyebrow>{en.vendor.nextEyebrow}</Eyebrow>
                <Text variant="caption" weight="400" color="textSecondary">{en.vendor.followersWaiting(stats?.followers ?? 0)}</Text>
                <Button size="xl" label={en.vendor.setMenu} onPress={actions.onSetMenu} testID="set-menu" />
              </Card>
            ) : action === 'done' ? (
              <Card testID="done-today" style={{ gap: t.spacing.sm }}>
                <Text variant="cardTitle">{en.vendor.doneForToday}</Text>
                <Text variant="bodySmall" color="textSecondary">{en.vendor.doneAsk}</Text>
                <Button size="xl" label={en.vendor.sendADeal} onPress={actions.onSendDeal} testID="done-send-deal" />
              </Card>
            ) : (
              <Card testID="next-stop-card" style={{ gap: t.spacing.xxs }}>
                <Eyebrow>{en.vendor.nextEyebrow}</Eyebrow>
                <Text variant="cardTitle">{next ? en.vendor.nextStopLine(`${next.societyName}, ${next.gateName}`, formatIstTimeOfClock(next.windowStart)) : en.vendor.noMoreStops}</Text>
                <Text variant="bodySmall" color="textSecondary">{en.vendor.tapArrived}</Text>
              </Card>
            )}
            <Text variant="caption" color="textMuted" testID="stats-line">{statsLine}</Text>
          </View>

          {/* Day checklist: Menu · Photo · Stops */}
          <Section title={en.vendor.todayChecklist}>
            <View>
              {published ? (
                <CheckRow testID="menu-live" icon={CircleCheck} done label={en.vendor.menuLive(menu!.lines.length)} sub={en.vendor.updatedAt(formatIstTime(menu!.updatedAt))} link={en.common.edit} onPress={actions.onSetMenu} />
              ) : (
                <CheckRow testID="check-menu" icon={ClipboardList} done={false} label={en.vendor.setMenu} onPress={actions.onSetMenu} link={en.vendor.start} />
              )}
              {photoUrl ? (
                <View testID="photo-added" style={[styles.row, { minHeight: t.layout.vendorPrimaryHeight, gap: t.spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.divider }]}>
                  <Image source={{ uri: photoUrl }} style={{ width: 40, height: 40, borderRadius: t.radius.tile, backgroundColor: t.colors.surface2 }} />
                  <View style={styles.flex}>
                    <Text variant="label">{en.vendor.photoAdded}</Text>
                    {menu?.stockPhotoAt ? <Text variant="caption" weight="400" color="textSecondary">{formatIstTime(menu.stockPhotoAt)}</Text> : null}
                  </View>
                  <Pressable accessibilityRole="button" onPress={actions.onAddPhoto} hitSlop={12} style={{ minHeight: t.layout.minTouch, justifyContent: 'center' }}>
                    <Text variant="label" color="accent">{en.vendor.change}</Text>
                  </Pressable>
                </View>
              ) : (
                <CheckRow testID="step-photo" icon={Camera} done={false} label={en.vendor.addTodaysPhoto} sub={en.vendor.photoOptional} link={en.vendor.add} onPress={actions.onAddPhoto} />
              )}
              <CheckRow testID="check-stops" icon={CircleCheck} done={all.length > 0 && done} label={en.vendor.stopsProgress(doneCount, all.length)} last />
            </View>
          </Section>

          {/* UX-33: quick actions */}
          <View style={[styles.row, { gap: t.spacing.xs, alignItems: 'stretch' }]}>
            <QuickTile testID="quick-soldout" icon={PackageX} label={en.vendor.markSoldOut} onPress={actions.onSoldOut} disabled={!published} />
            <QuickTile testID="quick-deal" icon={Tag} label={en.vendor.eveningDealShort} onPress={actions.onSendDeal} disabled={!published || !dealOpen} />
            <QuickTile testID="quick-requests" icon={ClipboardList} label={en.vendor.requestsShort} onPress={actions.onRequests} />
          </View>

          {/* UX-32: only the next stop here; the full list is on the Stops tab */}
          <Section title={en.vendor.nextStopTitle} action={actions.onAllStops ? { label: en.vendor.allStops, onPress: actions.onAllStops } : undefined}>
            {all.length === 0 ? (
              <Text variant="bodySmall" color="textSecondary">{en.vendor.noStopsToday}</Text>
            ) : next ? (
              <StopRow society={next.societyName} gate={next.gateName} windowStart={next.windowStart} windowEnd={next.windowEnd} followers={next.followers} state="upcoming" last />
            ) : (
              <Text variant="bodySmall" color="textSecondary">{en.vendor.noMoreStops}</Text>
            )}
          </Section>
          <View style={{ height: t.heights.fab + t.spacing.xl }} />
        </Sections>
      </SheetBody>
    </View>
  );
}

/** "08:00:00" → "8:00 AM" without a date */
function formatIstTimeOfClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
