import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ChevronRight, HelpCircle, Settings, Bell, Phone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Card, Icon, Screen, StatusPill, Text, TopAppBar, type LucideIcon } from '../../ui';
import { useSession } from '../auth/session';
import { en } from '../../i18n/en';

export function LinkRow({ icon, label, onPress, sub }: { icon: LucideIcon; label: string; onPress: () => void; sub?: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', minHeight: t.layout.listRowWithImage - 16, gap: t.spacing.sm }}>
      <Icon icon={icon} color="textSecondary" />
      <View style={{ flex: 1 }}>
        <Text>{label}</Text>
        {sub ? <Text variant="caption" color="textSecondary">{sub}</Text> : null}
      </View>
      <Icon icon={ChevronRight} color="textMuted" size={20} />
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
    <Screen header={<TopAppBar title={en.profile.title} onBack={onBack} />}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <Avatar name={account.name ?? '?'} size={64} />
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text variant="h2">{account.name}</Text>
          {account.phone_last4 ? <Text color="textSecondary">{en.profile.phone(account.phone_last4)}</Text> : null}
          {account.email ? <Text variant="caption" color="textSecondary">{account.email}</Text> : null}
          <StatusPill status="verified" label={account.role === 'vendor' ? en.profile.vendorBadge : en.profile.buyerBadge} />
        </View>
      </Card>
      <Card>
        <LinkRow
          icon={Phone}
          label={account.phone_last4 ? en.profile.editMobile : en.profile.addMobile}
          sub={account.phone_last4 ? en.profile.phone(account.phone_last4) : undefined}
          onPress={() => router.push('/account/phone')}
        />
        {/* Email add/verify is only for an extra login method; Google users already sign in with email. */}
        {account.provider !== 'google' ? (
        <LinkRow
          icon={Bell}
          label={account.email && account.email_verified ? en.profile.email : account.pending_email ? en.profile.verifyEmail : en.profile.addEmail}
          sub={emailSub}
          onPress={() => router.push('/account/email')}
        />
        ) : null}
        <LinkRow icon={Bell} label={en.profile.notifSettings} onPress={() => router.push('/account/notifications')} />
        <LinkRow icon={Settings} label={en.profile.settings} onPress={() => router.push('/account/settings')} />
        <LinkRow icon={HelpCircle} label={en.profile.help} onPress={() => router.push('/account/help')} />
      </Card>
    </Screen>
  );
}
