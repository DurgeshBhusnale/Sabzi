import { router } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, PhotoUploader, Screen, Text, TopAppBar } from '../../src/ui';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { captureCompressed } from '../../src/features/vendor/photos';
import { setStockPhoto, todayIst } from '../../src/features/vendor/api';
import { useInvalidateVendor, useMyVendor, vendorKeys } from '../../src/features/vendor/hooks';
import { uploadImage } from '../../src/lib/storage';
import { openAppSettings } from '../../src/lib/permissions';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

type Phase = 'intro' | 'preview' | 'uploading' | 'failed' | 'denied';

/** V-07: camera only, compressed under 300 KB, replaces yesterday's. */
export default function StockPhoto() {
  const t = useTheme();
  const vendor = useMyVendor();
  const invalidate = useInvalidateVendor();
  const [phase, setPhase] = useState<Phase>('intro');
  const [uri, setUri] = useState<string | null>(null);

  const capture = async () => {
    const r = await captureCompressed();
    if (r.kind === 'denied') return setPhase('denied');
    if (r.kind === 'cancelled') return;
    setUri(r.uri);
    setPhase('preview');
  };

  const upload = async () => {
    if (!uri || !vendor.data) return;
    setPhase('uploading');
    try {
      const path = `${vendor.data.user_id}/${todayIst()}.jpg`;
      await uploadImage('stock-photos', path, uri);
      await setStockPhoto(path);
      track('stock_photo_added');
      await invalidate(vendorKeys.today);
      router.back();
    } catch {
      setPhase('failed');
    }
  };

  if (phase === 'denied') {
    return <SystemScreen illustration="camera" title={en.vendor.cameraTitle} body={en.vendor.cameraBody} actionLabel={en.common.openSettings} onAction={openAppSettings} secondaryLabel={en.permissions.skipToday} onSecondary={() => router.back()} testID="x10" />;
  }

  return (
    <Screen
      header={<TopAppBar title={en.vendor.photoTitle} onBack={() => router.back()} />}
      footer={
        phase === 'preview' ? (
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <View style={{ flex: 1 }}><Button size="xl" variant="secondary" label={en.vendor.retake} onPress={capture} /></View>
            <View style={{ flex: 1 }}><Button size="xl" label={en.vendor.usePhoto} onPress={upload} testID="use-photo" /></View>
          </View>
        ) : phase === 'failed' ? (
          <Button size="xl" label={en.vendor.retryUpload} onPress={upload} />
        ) : phase === 'intro' ? (
          <Button size="xl" label={en.vendor.takePhoto} onPress={capture} testID="take-photo" />
        ) : null
      }
    >
      {phase === 'intro' ? (
        <Card style={{ alignItems: 'center', gap: t.spacing.md, borderStyle: 'dashed', borderWidth: 2, borderColor: t.colors.primary, paddingVertical: t.spacing.huge }}>
          <Text variant="h2" align="center">{en.vendor.fitTempo}</Text>
        </Card>
      ) : null}
      {uri && phase !== 'intro' ? <Image source={{ uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: t.radius.photo, backgroundColor: t.colors.surface2 }} accessibilityLabel={en.vendor.photoTitle} /> : null}
      {phase === 'uploading' ? <PhotoUploader state="uploading" progress={0.62} uri={uri} /> : null}
      {phase === 'failed' ? (
        <Card tint="error">
          <Text weight="600" color="error">{en.vendor.uploadFailed}</Text>
          <Text variant="bodySmall" color="textSecondary">{en.vendor.uploadFailedBody}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
