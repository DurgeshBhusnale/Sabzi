import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { APP_NAME } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { APP_ICON, ILLUSTRATION_ART } from '../../ui/Art';
import { Text } from '../../ui/Text';
import { en } from '../../i18n/en';

/** v4 wordmark: app icon (D01) + "Pheri" in Newsreader. */
export function Logo({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { gap: t.spacing.xs }]} accessible accessibilityLabel={APP_NAME}>
      <Image source={APP_ICON} style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }} />
      <Text variant="h1" color={onDark ? 'onForest' : 'primary'} style={{ fontSize: Math.round(size * 0.8), lineHeight: Math.round(size * 1.05), fontStyle: 'normal' }}>
        {APP_NAME}
      </Text>
    </View>
  );
}

/** S-01: launch illustration (C15) and the wordmark; after 3 s shows the slow-start line. */
export function Splash() {
  const t = useTheme();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(id);
  }, []);
  return (
    <View testID="splash" style={[styles.fill, styles.center, { backgroundColor: t.colors.bg, gap: t.spacing.xs }]}>
      <Image source={ILLUSTRATION_ART.splash} resizeMode="contain" style={{ width: 280, height: 280, borderRadius: t.radius.dialog }} accessible={false} />
      <Text variant="display" color="primary" style={{ fontSize: 40, lineHeight: 46 }}>{APP_NAME}</Text>
      {slow ? <Text variant="bodySmall" color="textSecondary">{en.splash.slow}</Text> : null}
      <Text variant="caption" weight="400" color="textSecondary" style={[styles.version, { bottom: t.spacing.xxl }]}>
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
