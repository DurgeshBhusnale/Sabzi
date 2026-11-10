import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
}

/** Vendor photo or buyer initial; grey placeholder while loading. */
export function Avatar({ name, uri, size = 48, loading = false }: { name: string; uri?: string | null; size?: number; loading?: boolean }) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (loading) return <View testID="avatar-loading" style={[base, { backgroundColor: t.colors.surface2 }]} />;
  if (uri && !failed) {
    return (
      <Image
        testID="avatar-image"
        accessibilityLabel={`${name} photo`}
        source={{ uri }}
        onError={() => setFailed(true)}
        style={[base, { backgroundColor: t.colors.surface2 }]}
      />
    );
  }
  return (
    <View testID="avatar-initial" accessibilityLabel={name} style={[base, styles.center, { backgroundColor: t.colors.surface2 }]}>
      <Text variant="h2" color="primary" style={{ fontSize: Math.round(size * 0.45), lineHeight: Math.round(size * 0.55) }}>
        {initials(name)}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
