import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ChevronRight, Settings, Bell, Mail, Phone, Star } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { LIMITS, PILOT_AREA_LABELS } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, Icon, Screen, Section, Sections, StatusPill, Text, TopAppBar, type LucideIcon } from '../../ui';
import { buyerKeys, useMySocieties } from '../buyer/hooks';
import { removeSociety, setPrimarySociety } from '../buyer/api';
import { useMyVendor } from '../vendor/hooks';
import { useSession } from '../auth/session';
import { en } from '../../i18n/en';

export function LinkRow({ icon, label, onPress, sub, last, danger, chevron = !danger, testID }: { icon: LucideIcon; label: string; onPress: () => void; sub?: string; last?: boolean; danger?: boolean; chevron?: boolean; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 60, gap: t.spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.divider, opacity: pressed ? 0.7 : 1 })}
    >
      <Icon icon={icon} size={20} color={danger ? 'error' : 'primary'} />
      <View style={{ flex: 1 }}>
        <Text variant="label" color={danger ? 'error' : 'textPrimary'}>{label}</Text>
        {sub ? <Text variant="caption" weight="400" color="textSecondary">{sub}</Text> : null}
      </View>
      {chevron ? <Icon icon={ChevronRight} color="textSecondary" size={16} /> : null}
    </Pressable>
  );
}

/** UX-26: the buyer's saved societies live here (primary ★, make primary, remove, add up to 3). */
export function MySocieties() {
  const t = useTheme();
  const mine = useMySocieties();
  const qc = useQueryClient();
  const list = mine.data ?? [];
  const full = list.length >= LIMITS.maxSocieties;
  const refresh = () => qc.invalidateQueries({ queryKey: buyerKeys.mine });
  return (
    <Section title={en.buyer.mySocieties} testID="my-societies">
      <View>
        {list.map((s, i) => (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, minHeight: t.layout.listRowWithImage, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: t.colors.divider }}>
            <View style={{ flex: 1 }}>
              <Text variant="label">{s.name}</Text>
              <Text variant="caption" color="textSecondary">{[PILOT_AREA_LABELS[s.area], s.is_primary ? en.buyer.primary : null].filter(Boolean).join(' · ')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={s.is_primary ? en.buyer.primary : en.buyer.makePrimary}
              accessibilityState={{ selected: s.is_primary }}
              onPress={async () => {
                if (s.is_primary) return;
                await setPrimarySociety(s.id);
                await refresh();
              }}
              testID={`primary-${s.id}`}
              style={{ minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon icon={Star} color={s.is_primary ? 'dealAmber' : 'textMuted'} filled={s.is_primary} />
            </Pressable>
            {list.length > 1 && !s.is_primary ? (
              <Button
                label={en.buyer.remove}
                variant="tertiary"
                fullWidth={false}
                testID={`remove-${s.id}`}
                onPress={async () => {
                  await removeSociety(s.id);
                  await refresh();
                }}
              />
            ) : null}
          </View>
        ))}
      </View>
      <Button label={en.buyer.addSociety} variant="secondary" disabled={full} onPress={() => router.push('/buyer-setup/society')} testID="add-society" />
      {full ? <Text variant="caption" color="textSecondary">{en.buyer.maxSocieties}</Text> : null}
    </Section>
  );
}

/** UX-28: vendors see their real verification state; buyers get no badge. */
function VendorBadge() {
  const v = useMyVendor();
  if (!v.data) return null;
  const verified = v.data.status === 'verified';
  return <StatusPill status={verified ? 'verified' : 'waiting'} label={verified ? en.buyer.verifiedVendor : en.buyer.waitingVerification} />;
}

/** S-10 (UX audit §4): identity, My societies (buyers), account, notification settings, Settings. Help lives in Settings. */
export function ProfileScreen({ onBack }: { onBack?: () => void }) {
  const t = useTheme();
  const { account } = useSession();
  if (!account) return null;
  const emailSub = account.email && account.email_verified ? account.email : account.pending_email ? `${account.pending_email} · ${en.profile.emailUnverified}` : en.profile.emailHint;
  return (
    <Screen header={<TopAppBar title={onBack ? en.profile.title : undefined} onBack={onBack} />}>
      <Sections>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xs }}>
          <Avatar name={account.name ?? '?'} size={72} />
          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text variant="h1">{account.name}</Text>
            {account.email ? <Text variant="caption" weight="400" color="textSecondary">{account.email}</Text> : null}
            {account.role === 'vendor' ? <VendorBadge /> : null}
          </View>
        </View>
        {account.role === 'buyer' ? <MySocieties /> : null}
        <View>
          <LinkRow
            icon={Phone}
            label={account.phone_last4 ? en.profile.editMobile : en.profile.addMobile}
            sub={account.phone_last4 ? en.profile.phone(account.phone_last4) : undefined}
            onPress={() => router.push('/account/phone')}
          />
          {/* Email add/verify is only an extra login for phone-OTP users; Google and email users already sign in with email. */}
          {account.provider === 'phone' ? (
            <LinkRow
              icon={Mail}
              label={account.email && account.email_verified ? en.profile.email : account.pending_email ? en.profile.verifyEmail : en.profile.addEmail}
              sub={emailSub}
              onPress={() => router.push('/account/email')}
            />
          ) : null}
          <LinkRow icon={Bell} label={en.profile.notifSettings} onPress={() => router.push('/account/notifications')} />
          <LinkRow icon={Settings} label={en.profile.settings} onPress={() => router.push('/account/settings')} last />
        </View>
      </Sections>
    </Screen>
  );
}
