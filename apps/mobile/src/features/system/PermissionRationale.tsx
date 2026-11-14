import { Image, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, ILLUSTRATION_ART, Screen, Text } from '../../ui';
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
        <Image source={kind === 'notifications' ? ILLUSTRATION_ART.getAlert : ILLUSTRATION_ART.pickSociety} resizeMode="contain" style={{ width: 200, height: 200 }} accessible={false} testID="rationale-art" />
        <Text variant="h1" align="center" accessibilityRole="header">{title}</Text>
        <Text color="textSecondary" align="center">{body}</Text>
      </View>
    </Screen>
  );
}
