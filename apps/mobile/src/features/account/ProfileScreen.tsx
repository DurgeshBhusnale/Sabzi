import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ChevronRight, HelpCircle, Settings, Bell, Phone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Icon, Screen, StatusPill, Text, TopAppBar, type LucideIcon } from '../../ui';
import { useSession } from '../auth/session';
import { en } from '../../i18n/en';

export function LinkRow({ icon, label, onPress, sub, last, danger }: { icon: LucideIcon; label: string; onPress: () => void; sub?: string; last?: boolean; danger?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 60, gap: t.spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.border, opacity: pressed ? 0.7 : 1 })}
    >
      <Icon icon={icon} size={20} color={danger ? 'error' : 'primary'} />
      <View style={{ flex: 1 }}>
        <Text variant="label" color={danger ? 'error' : 'textPrimary'}>{label}</Text>
        {sub ? <Text variant="caption" weight="400" color="textSecondary">{sub}</Text> : null}
      </View>
      <Icon icon={ChevronRight} color="textSecondary" size={16} />
    </Pressable>
  );
}

/** S-10: photo or initial, name, masked phone, email state, role badge, links. */
export function ProfileScreen({ onBack }: { onBack?: () => void }) {
  const t = useTheme();
  const { account } = useSession();
  if (!account) return null;
  const emailSub = account.email && account.email_verified ? account.email : account.pending_email ? `${account.pending_email} · ${en.profile.emailUnverified}` : en.profile.emailHint;
  return (
    <Screen header={<TopAppBar title={onBack ? en.profile.title : undefined} onBack={onBack} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xs }}>
        <Avatar name={account.name ?? '?'} size={72} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="h1" style={{ fontSize: 26, lineHeight: 30 }}>{account.name}</Text>
          {account.email ? <Text variant="caption" weight="400" color="textSecondary">{account.email}</Text> : null}
          <StatusPill status="verified" label={account.role === 'vendor' ? en.profile.vendorBadge : en.profile.buyerBadge} />
        </View>
      </View>
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
          icon={Bell}
          label={account.email && account.email_verified ? en.profile.email : account.pending_email ? en.profile.verifyEmail : en.profile.addEmail}
          sub={emailSub}
          onPress={() => router.push('/account/email')}
        />
        ) : null}
        <LinkRow icon={Bell} label={en.profile.notifSettings} onPress={() => router.push('/account/notifications')} />
        <LinkRow icon={Settings} label={en.profile.settings} onPress={() => router.push('/account/settings')} />
        <LinkRow icon={HelpCircle} label={en.profile.help} onPress={() => router.push('/account/help')} last />
      </View>
    </Screen>
  );
}
