import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui';

export function ActivityIndicatorBlock({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl }} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={t.colors.primary} />
      <Text>{label}</Text>
    </View>
  );
}
