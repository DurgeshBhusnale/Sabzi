import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Circle, CircleCheck, House, Truck } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Icon, Screen, Text } from '../../src/ui';
import { setRole, type Role } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** S-06: two large cards; role is set once. */
export default function RoleScreen() {
  const t = useTheme();
  const { refresh } = useSession();
  const [role, setRoleState] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cards: { role: Role; title: string; body: string; icon: typeof House }[] = [
    { role: 'buyer', title: en.auth.buyerRole, body: en.auth.buyerRoleBody, icon: House },
    { role: 'vendor', title: en.auth.vendorRole, body: en.auth.vendorRoleBody, icon: Truck },
  ];

  return (
    <Screen
      footer={
        <Button
          label={en.common.continue}
          disabled={!role}
          loading={busy}
          testID="role-continue"
          onPress={async () => {
            if (!role) return;
            setBusy(true);
            try {
              await setRole(role);
              track('signup_completed', { role });
              await refresh();
              router.replace('/(auth)/name');
            } catch (e) {
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <Text variant="h1" accessibilityRole="header">{en.auth.roleTitle}</Text>
      <Text color="textSecondary">{en.auth.roleBody}</Text>
      {cards.map((c) => {
        const selected = role === c.role;
        return (
          <Pressable
            key={c.role}
            testID={`role-${c.role}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${c.title}. ${c.body}`}
            onPress={() => setRoleState(c.role)}
            style={{
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? t.colors.primary : t.colors.border,
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              padding: t.spacing.lg,
              gap: t.spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ width: 44, height: 44, borderRadius: t.radius.button, backgroundColor: c.role === 'buyer' ? t.colors.sage : t.colors.dealAmberTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={c.icon} size={22} color="primary" />
              </View>
              <Icon icon={selected ? CircleCheck : Circle} size={22} color={selected ? 'primary' : 'border'} />
            </View>
            <Text variant="h1" style={{ fontSize: 22, lineHeight: 26 }}>{c.title}</Text>
            <Text variant="bodySmall" color="textSecondary">{c.body}</Text>
          </Pressable>
        );
      })}
      {error ? <Text color="error">{error}</Text> : null}
    </Screen>
  );
}
