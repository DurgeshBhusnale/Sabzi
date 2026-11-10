import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { formatIstRelative } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { IconCircleButton, Text } from '../../src/ui';
import { ImageOff, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { publicUrl } from '../../src/lib/storage';
import { en } from '../../src/i18n/en';

/** B-06: full-screen photo with zoom, time taken; loading and failed states. */
export default function PhotoViewer() {
  const t = useTheme();
  const { path, at, name } = useLocalSearchParams<{ path: string; at?: string; name?: string }>();
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const uri = publicUrl('stock-photos', path);
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.snackbarBg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingHorizontal: t.spacing.md, minHeight: 56 }}>
          <IconCircleButton icon={X} label={en.common.close} onPress={() => router.back()} onDark testID="photo-close" />
          {name ? <Text variant="label" style={{ color: t.colors.snackbarText }}>{name}</Text> : null}
        </View>
      </SafeAreaView>
      <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={styles.center}>
        {uri && state !== 'failed' ? (
          <Image source={{ uri }} onLoad={() => setState('loaded')} onError={() => setState('failed')} style={{ width: '100%', aspectRatio: 3 / 4 }} resizeMode="contain" accessibilityLabel={en.vendorCard.stockPhoto} />
        ) : null}
        {state === 'loading' ? <ActivityIndicator color={t.colors.snackbarText} /> : null}
        {state === 'failed' || !uri ? (
          <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
            <ImageOff size={40} color={t.colors.snackbarText} />
            <Text style={{ color: t.colors.snackbarText }}>{en.buyer.photoFailed}</Text>
          </View>
        ) : null}
      </ScrollView>
      {at ? <Text style={{ color: t.colors.snackbarText, padding: t.spacing.md }}>{formatIstRelative(at)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' } });
