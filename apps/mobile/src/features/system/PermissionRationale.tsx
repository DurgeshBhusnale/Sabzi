import { View } from 'react-native';
import { BellRing, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, Icon, Screen, Text } from '../../ui';
import { en } from '../../i18n/en';

/** S-08 / S-09: rationale before the system prompt; Allow and Not now. */
export function PermissionRationale({ kind, title, body, onAllow, onSkip, busy }: { kind: 'notifications' | 'location'; title: string; body: string; onAllow: () => void; onSkip: () => void; busy?: boolean }) {
  const t = useTheme();
  return (
    <Screen
      scroll={false}
      testID={`rationale-${kind}`}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button label={en.common.allow} onPress={onAllow} loading={busy} testID="allow" />
          <Button label={en.common.notNow} variant="tertiary" onPress={onSkip} testID="not-now" />
        </View>
      }
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: t.spacing.md }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: t.colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={kind === 'notifications' ? BellRing : MapPin} size={72} color="brandLeaf" />
        </View>
        <Text variant="h1" align="center" accessibilityRole="header">{title}</Text>
        <Text color="textSecondary" align="center">{body}</Text>
      </View>
    </Screen>
  );
}
