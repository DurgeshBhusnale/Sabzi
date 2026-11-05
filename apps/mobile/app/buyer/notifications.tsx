import { router } from 'expo-router';
import { View } from 'react-native';
import { formatIstRelative } from '@sabzi/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Card, EmptyState, Screen, SkeletonBlock, Text, TopAppBar } from '../../src/ui';
import { buyerKeys, useNotifications } from '../../src/features/buyer/hooks';
import { markOpened } from '../../src/features/buyer/api';
import { notificationTarget, notificationText } from '../../src/features/buyer/notificationCopy';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** B-15: last 7 days with unread markers; tap opens the right screen. */
export default function Notifications() {
  const t = useTheme();
  const list = useNotifications();
  const qc = useQueryClient();
  return (
    <Screen header={<TopAppBar title={en.buyer.notifTitle} onBack={() => router.back()} />} refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      {list.isLoading ? (
        <SkeletonBlock kind="list" count={4} />
      ) : !list.data?.length ? (
        <EmptyState illustration="bell" title={en.buyer.nothingNew} testID="notif-empty" />
      ) : (
        list.data.map((n) => {
          const txt = notificationText(n);
          return (
            <Card
              key={n.id}
              tint={n.opened_at ? undefined : 'primary'}
              testID={`notif-${n.id}`}
              accessibilityLabel={`${n.opened_at ? '' : 'Unread. '}${txt.title}. ${txt.body}`}
              onPress={async () => {
                if (!n.opened_at) {
                  await markOpened(n.id);
                  track('alert_opened', { type: n.type });
                  qc.invalidateQueries({ queryKey: buyerKeys.notifications });
                }
                router.push(notificationTarget(n) as never);
              }}
            >
              <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                {!n.opened_at ? <View testID="unread" style={{ width: 8, height: 8, borderRadius: 4, marginTop: t.spacing.xs, backgroundColor: t.colors.primary }} /> : null}
                <View style={{ flex: 1 }}>
                  <Text weight={n.opened_at ? '500' : '700'}>{txt.title}</Text>
                  {txt.body ? <Text variant="bodySmall" color="textSecondary">{txt.body}</Text> : null}
                  <Text variant="caption" color="textMuted">{formatIstRelative(n.sent_at)}</Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
