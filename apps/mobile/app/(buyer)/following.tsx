import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { BellOff, BellRing } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { statusLabel } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Avatar, Dialog, EmptyState, Icon, Screen, SheetBody, SkeletonBlock, Snackbar, StatusPill, Text, TopAppBar } from '../../src/ui';
import { useFollowing } from '../../src/features/buyer/hooks';
import { unfollow } from '../../src/features/buyer/api';
import { publicUrl } from '../../src/lib/storage';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

type Followed = NonNullable<ReturnType<typeof useFollowing>['data']>[number];

/** B-08: forest header, followed vendors with live status, society and alert state. Long-press (or the a11y action) unfollows. */
export default function Following() {
  const t = useTheme();
  const following = useFollowing();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Followed | null>(null);
  const list = following.data ?? [];

  const doUnfollow = async (f: Followed) => {
    await unfollow(f.vendor_id, f.society_id);
    track('vendor_unfollowed');
    setToast(en.buyer.unfollowedSnack(f.display_name.split(' ')[0]!));
    await qc.invalidateQueries({ queryKey: ['buyer'] });
  };

  return (
    <Screen
      tone="forest"
      header={<TopAppBar tone="forest" title={en.buyer.followingTitle} subtitle={list.length ? en.buyer.vendorCount(list.length) : undefined} />}
      refreshing={following.isRefetching}
      onRefresh={() => following.refetch()}
    >
      <SheetBody>
      {toast ? <Snackbar kind="info" message={toast} /> : null}
      {following.isLoading ? (
        <SkeletonBlock kind="vendorCard" count={4} />
      ) : !list.length ? (
        <EmptyState illustration="crate" art="notFollowing" title={en.buyer.notFollowingTitle} body={en.buyer.notFollowingBody} actionLabel={en.buyer.findVendors} onAction={() => router.push('/(buyer)/home')} testID="following-empty" />
      ) : (
        <View>
          {list.map((f, i) => {
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
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 64, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: t.colors.border, opacity: pressed ? 0.7 : status === 'left' || status === 'not_coming' ? 0.7 : 1 })}
              >
                <Avatar name={f.display_name} uri={publicUrl('vendor-photos', f.photo_path)} size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{f.display_name}</Text>
                  <Text variant="caption" weight="400" color="textSecondary">{`${label} · ${f.society_name}`}</Text>
                </View>
                {status === 'at_gate' || status === 'leaving_soon' ? <StatusPill status={status} label={en.buyer.atTheGate} /> : null}
                <Icon icon={f.notify_arrival ? BellRing : BellOff} size={18} color={f.notify_arrival ? 'primary' : 'textMuted'} />
              </Pressable>
            );
          })}
          <Text variant="caption" weight="400" color="textMuted" align="center" style={{ marginTop: t.spacing.md }}>{en.buyer.unfollowHint}</Text>
        </View>
      )}
      </SheetBody>
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
