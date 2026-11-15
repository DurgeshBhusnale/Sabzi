import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { BellOff, BellRing } from 'lucide-react-native';
import { FollowSheet } from '../../src/features/buyer/FollowSheet';
import { useQueryClient } from '@tanstack/react-query';
import { statusLabel } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Avatar, Button, Dialog, EmptyState, Screen, SectionLabel, Sections, SkeletonBlock, Snackbar, StatusPill, Text, TopAppBar } from '../../src/ui';
import { useFollowing, useMySocieties } from '../../src/features/buyer/hooks';
import { follow, unfollow } from '../../src/features/buyer/api';
import { publicUrl } from '../../src/lib/storage';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

type Followed = NonNullable<ReturnType<typeof useFollowing>['data']>[number];

/** Followed vendors grouped by society, in first-seen order (UX-19). Pure for tests. */
export function groupBySociety<T extends { society_id: string; society_name: string }>(list: T[]): { id: string; name: string; rows: T[] }[] {
  const groups = new Map<string, { id: string; name: string; rows: T[] }>();
  for (const f of list) {
    const g = groups.get(f.society_id) ?? { id: f.society_id, name: f.society_name, rows: [] };
    g.rows.push(f);
    groups.set(f.society_id, g);
  }
  return [...groups.values()];
}

/**
 * B-08 (UX audit §4): a management list grouped by society. Each row has a 48 dp "Alerts" button that opens the
 * follow sheet in edit mode (alert switches + Unfollow). Long-press still unfollows as a shortcut.
 */
export default function Following() {
  const t = useTheme();
  const following = useFollowing();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Followed | null>(null);
  const [editing, setEditing] = useState<Followed | null>(null);
  const mine = useMySocieties();
  const list = following.data ?? [];
  const groups = groupBySociety(list);

  const doUnfollow = async (f: Followed) => {
    await unfollow(f.vendor_id, f.society_id);
    track('vendor_unfollowed');
    setToast(en.buyer.unfollowedSnack(f.display_name.split(' ')[0]!));
    await qc.invalidateQueries({ queryKey: ['buyer'] });
  };

  return (
    <Screen
      header={<TopAppBar title={en.buyer.followingTitle} subtitle={list.length ? en.buyer.vendorCount(list.length) : undefined} />}
      refreshing={following.isRefetching}
      onRefresh={() => following.refetch()}
    >
      {/* UX-22 (owner decision §6 #6): light top bar on list tabs; forest is for live moments */}
      <>
      {toast ? <Snackbar kind="info" message={toast} /> : null}
      {following.isLoading ? (
        <SkeletonBlock kind="vendorCard" count={4} />
      ) : !list.length ? (
        <EmptyState illustration="crate" art="notFollowing" title={en.buyer.notFollowingTitle} body={en.buyer.notFollowingBody} actionLabel={en.buyer.findVendors} onAction={() => router.push('/(buyer)/home')} testID="following-empty" />
      ) : (
        <Sections>
          {groups.map((g) => (
            <View key={g.id} style={{ gap: t.spacing.xs }} testID={`society-group-${g.id}`}>
              <SectionLabel>{g.name}</SectionLabel>
              <View>
                {g.rows.map((f, i) => {
                  const status = f.today?.status ?? 'expected';
                  const label = f.today ? statusLabel(status, { gateName: f.today.gate_name, windowStart: f.today.window_start, windowEnd: f.today.window_end, since: f.today.status_at }) : en.buyer.notToday;
                  return (
                    <Pressable
                      key={`${f.vendor_id}-${f.society_id}`}
                      testID={`following-${f.vendor_id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${f.display_name}, ${label}, ${f.society_name}`}
                      accessibilityActions={[{ name: 'unfollow', label: en.buyer.unfollow }]}
                      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'unfollow' && setConfirm(f)}
                      onPress={() => router.push({ pathname: '/buyer/vendor/[id]', params: { id: f.vendor_id, society: f.society_id } })}
                      onLongPress={() => setConfirm(f)}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.layout.listRowWithImage + t.spacing.xs, borderBottomWidth: i === g.rows.length - 1 ? 0 : 1, borderBottomColor: t.colors.divider, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Avatar name={f.display_name} uri={publicUrl('vendor-photos', f.photo_path)} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text variant="label">{f.display_name}</Text>
                        <Text variant="caption" weight="400" color={status === 'left' || status === 'not_coming' ? 'textMuted' : 'textSecondary'}>
                          {f.rating_count > 0 ? `${Number(f.avg_rating).toFixed(1)} ★ · ${label}` : label}
                        </Text>
                      </View>
                      {status === 'at_gate' || status === 'leaving_soon' ? <StatusPill status={status} label={en.buyer.atTheGate} /> : null}
                      <Button
                        label={en.buyer.alerts}
                        icon={f.notify_arrival ? BellRing : BellOff}
                        variant="tertiary"
                        fullWidth={false}
                        accessibilityLabel={f.notify_arrival ? en.buyer.alertsOn(f.display_name) : en.buyer.alertsOff(f.display_name)}
                        onPress={() => setEditing(f)}
                        testID={`alerts-${f.vendor_id}`}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </Sections>
      )}
      </>
      {editing ? (
        <FollowSheet
          visible
          vendorName={editing.display_name}
          societies={(mine.data ?? []).filter((x) => x.id === editing.society_id)}
          servedSocietyIds={[editing.society_id]}
          defaultSociety={editing.society_id}
          initialPrefs={{ notify_arrival: editing.notify_arrival, notify_deals: editing.notify_deals, notify_requests: editing.notify_requests }}
          notificationsBlocked={false}
          onTurnOn={() => undefined}
          following
          onFollow={async (sid, prefs) => {
            await follow(editing.vendor_id, sid, prefs);
            setEditing(null);
            await qc.invalidateQueries({ queryKey: ['buyer'] });
          }}
          onUnfollow={async () => {
            const f = editing;
            setEditing(null);
            await doUnfollow(f);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <Dialog
        visible={!!confirm}
        kind="destructive"
        title={confirm ? en.buyer.unfollowQ(confirm.display_name) : ''}
        body={en.buyer.unfollowBody}
        confirmLabel={en.buyer.unfollow}
        cancelLabel={en.common.cancel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const f = confirm;
          setConfirm(null);
          if (f) await doUnfollow(f);
        }}
      />
    </Screen>
  );
}
