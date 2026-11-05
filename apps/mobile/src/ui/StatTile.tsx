import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

export function StatTile({ value, label, trend, zeroHint, loading = false }: { value: number | string; label: string; trend?: string; zeroHint?: string; loading?: boolean }) {
  const t = useTheme();
  if (loading) {
    return (
      <Card style={{ flex: 1, gap: t.spacing.xs }} testID="stat-loading">
        <Skeleton width="60%" height={28} />
        <Skeleton width="90%" height={12} />
      </Card>
    );
  }
  const zero = value === 0 || value === '0';
  return (
    <Card style={{ flex: 1, gap: 2 }} testID={`stat-${label}`}>
      <View accessible accessibilityLabel={`${value} ${label}`}>
        <Text variant="display" color={zero ? 'textMuted' : 'textPrimary'}>{String(value)}</Text>
        <Text color="textSecondary">{label}</Text>
      </View>
      {zero && zeroHint ? <Text variant="caption" color="textSecondary">{zeroHint}</Text> : trend ? <Text variant="caption" weight="600" color="primary">{trend}</Text> : null}
    </Card>
  );
}
