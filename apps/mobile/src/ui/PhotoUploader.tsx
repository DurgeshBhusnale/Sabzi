import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Camera, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { Text } from './Text';
import { en } from '../i18n/en';

export type PhotoUploaderState = 'empty' | 'capturing' | 'uploading' | 'uploaded' | 'failed';

/** Camera tile for today's stock photo (V-07, V-04 step 2). */
export function PhotoUploader({
  state,
  progress = 0,
  uri,
  takenAt,
  onPress,
  onRetry,
}: {
  state: PhotoUploaderState;
  progress?: number;
  uri?: string | null;
  takenAt?: string;
  onPress?: () => void;
  onRetry?: () => void;
}) {
  const t = useTheme();
  const c = t.colors;
  const base = { minHeight: 112, borderRadius: t.radius.card, overflow: 'hidden' as const, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (state === 'failed') {
    return (
      <Pressable testID="photo-failed" accessibilityRole="button" accessibilityLabel={en.photo.failed} onPress={onRetry} style={[base, { borderWidth: 1, borderColor: c.error, backgroundColor: c.errorTint, gap: t.spacing.xxs }]}>
        <Icon icon={RotateCcw} color="error" />
        <Text weight="600" color="error">{en.photo.retry}</Text>
      </Pressable>
    );
  }
  if (state === 'uploading' || state === 'uploaded') {
    return (
      <Pressable testID={`photo-${state}`} accessibilityRole="button" accessibilityLabel={state === 'uploaded' ? en.photo.uploaded : en.photo.uploading(Math.round(progress * 100))} onPress={onPress} style={[base, { backgroundColor: c.surface2 }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : null}
        {state === 'uploading' ? (
          <>
            <View style={[styles.badge, { backgroundColor: c.surface, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs }]}>
              <Text variant="caption" weight="600">{`${Math.round(progress * 100)}%`}</Text>
            </View>
            <View style={[styles.progress, { backgroundColor: c.primary, width: `${Math.round(progress * 100)}%` }]} />
          </>
        ) : takenAt ? (
          <View style={[styles.badge, { backgroundColor: c.surface, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs }]}>
            <Text variant="caption">{takenAt}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }
  return (
    <Pressable
      testID={`photo-${state}`}
      accessibilityRole="button"
      accessibilityLabel={en.photo.add}
      onPress={onPress}
      disabled={state === 'capturing'}
      style={[base, { borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.accent, backgroundColor: c.surface, gap: t.spacing.xxs }]}
    >
      <Icon icon={Camera} color="accent" />
      <Text variant="label" color="primary">{state === 'capturing' ? en.photo.capturing : en.photo.add}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: 8, left: 8 },
  progress: { position: 'absolute', bottom: 0, left: 0, height: 6 },
});
