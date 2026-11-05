import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, BottomSheet, Button, Text, Toggle } from '../../ui';
import type { FollowPrefs } from './api';
import type { SavedSociety } from './types';
import { en } from '../../i18n/en';

/** B-07: which society, arrival / deals / request-reply toggles; warning when notifications are blocked. */
export function FollowSheet({
  visible,
  vendorName,
  societies,
  servedSocietyIds,
  defaultSociety,
  initialPrefs,
  notificationsBlocked,
  onTurnOn,
  onFollow,
  onUnfollow,
  following,
  onClose,
}: {
  visible: boolean;
  vendorName: string;
  societies: SavedSociety[];
  servedSocietyIds: string[];
  defaultSociety: string | null;
  initialPrefs?: FollowPrefs;
  notificationsBlocked: boolean;
  onTurnOn: () => void;
  onFollow: (societyId: string, prefs: FollowPrefs) => Promise<void>;
  onUnfollow?: () => Promise<void>;
  following: boolean;
  onClose: () => void;
}) {
  const t = useTheme();
  const options = societies.filter((s) => servedSocietyIds.includes(s.id));
  const [society, setSociety] = useState<string | null>(defaultSociety && servedSocietyIds.includes(defaultSociety) ? defaultSociety : options[0]?.id ?? null);
  const [prefs, setPrefs] = useState<FollowPrefs>(initialPrefs ?? { notify_arrival: true, notify_deals: true, notify_requests: true });
  const [busy, setBusy] = useState(false);
  const first = vendorName.split(' ')[0] ?? vendorName;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={en.buyer.followAt(first)}
      testID="follow-sheet"
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button
            label={following ? en.common.save : en.buyer.follow}
            disabled={!society}
            loading={busy}
            testID="confirm-follow"
            onPress={async () => {
              setBusy(true);
              try {
                await onFollow(society!, prefs);
              } finally {
                setBusy(false);
              }
            }}
          />
          {following && onUnfollow ? <Button label={en.buyer.unfollow} variant="tertiary" onPress={onUnfollow} testID="unfollow" /> : null}
        </View>
      }
    >
      {notificationsBlocked ? <Banner kind="error" message={en.buyer.notifBlocked} actionLabel={en.buyer.turnOn} onAction={onTurnOn} testID="follow-notif-blocked" /> : null}
      {options.map((s) => {
        const on = s.id === society;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => setSociety(s.id)}
            style={{ minHeight: t.heights.input, justifyContent: 'center', paddingHorizontal: t.spacing.md, borderRadius: t.radius.card, borderWidth: on ? 2 : 1, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? t.colors.primaryTint : t.colors.surface }}
          >
            <Text weight={on ? '600' : '400'}>{s.name}</Text>
          </Pressable>
        );
      })}
      <Toggle label={en.buyer.arrivalAlerts} value={prefs.notify_arrival} onChange={(v) => setPrefs({ ...prefs, notify_arrival: v })} />
      <Toggle label={en.buyer.eveningDealAlerts} value={prefs.notify_deals} onChange={(v) => setPrefs({ ...prefs, notify_deals: v })} />
      <Toggle label={en.buyer.requestReplies} value={prefs.notify_requests} onChange={(v) => setPrefs({ ...prefs, notify_requests: v })} />
    </BottomSheet>
  );
}
