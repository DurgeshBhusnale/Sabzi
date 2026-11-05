import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapPin, Leaf } from 'lucide-react-native';
import Constants from 'expo-constants';
import { APP_NAME } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { en } from '../../i18n/en';

/** Leaf + pin mark with a replaceable wordmark (design brief §2.7). */
export function Logo({ size = 40 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { gap: t.spacing.xs }]} accessible accessibilityLabel={APP_NAME}>
      <View style={{ width: size, height: size }}>
        <Icon icon={MapPin} size={size} color="brandLeaf" />
        <View style={[StyleSheet.absoluteFill, styles.center, { paddingBottom: size * 0.2 }]}>
          <Icon icon={Leaf} size={size * 0.38} color="brandLeaf" filled />
        </View>
      </View>
      <Text variant="display" color="textPrimary">{APP_NAME}</Text>
    </View>
  );
}

/** S-01: shown while fonts and the session load; after 3 s shows the slow-start line. */
export function Splash() {
  const t = useTheme();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(id);
  }, []);
  return (
    <View testID="splash" style={[styles.fill, styles.center, { backgroundColor: t.colors.bg, gap: t.spacing.md }]}>
      <Logo size={56} />
      {slow ? <Text color="textSecondary">{en.splash.slow}</Text> : null}
      <Text variant="caption" color="textMuted" style={[styles.version, { bottom: t.spacing.xxl }]}>
        {`v${Constants.expoConfig?.version ?? '0.0.0'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  version: { position: 'absolute' },
});
