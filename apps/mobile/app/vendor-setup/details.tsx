import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Truck, ShoppingCart } from 'lucide-react-native';
import { vendorProfileSchema } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Checkbox, Icon, PhotoUploader, Screen, SkeletonBlock, Text, TextInput, Toggle, TopAppBar, VENDOR_ART, type PhotoUploaderState } from '../../src/ui';
import { useMyVendor, useInvalidateVendor, vendorKeys } from '../../src/features/vendor/hooks';
import { saveVendorProfile, type MyVendor } from '../../src/features/vendor/api';
import { captureCompressed } from '../../src/features/vendor/photos';
import { uploadImage, publicUrl } from '../../src/lib/storage';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** V-01: business details. Empty, filled, photo uploading, error. */
export default function BusinessDetails() {
  const vendor = useMyVendor();
  if (vendor.isLoading) return <Screen><SkeletonBlock kind="list" count={4} /></Screen>;
  return <DetailsForm v={vendor.data ?? null} />;
}

function DetailsForm({ v }: { v: MyVendor | null }) {
  const t = useTheme();
  const { account } = useSession();
  const invalidate = useInvalidateVendor();
  const [name, setName] = useState(v?.display_name ?? '');
  const [vehicle, setVehicle] = useState<'tempo' | 'thela' | null>(v?.vehicle ?? null);
  const [vehicleNo, setVehicleNo] = useState(v?.vehicle_no ?? '');
  const [pmcId, setPmcId] = useState(v?.pmc_vendor_id ?? '');
  const [delivery, setDelivery] = useState(v?.delivery_available ?? false);
  const [calls, setCalls] = useState(v?.allow_calls ?? false);
  const [photoPath, setPhotoPath] = useState<string | null | undefined>(undefined);
  const [photoUri, setPhotoUri] = useState<string | null>(publicUrl('vendor-photos', v?.photo_path));
  const [photoState, setPhotoState] = useState<PhotoUploaderState>(v?.photo_path ? 'uploaded' : 'empty');
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const takePhoto = async () => {
    setPhotoState('capturing');
    const r = await captureCompressed(1024 * 1024);
    if (r.kind !== 'ok') {
      setPhotoState(photoUri ? 'uploaded' : 'empty');
      return;
    }
    setPhotoUri(r.uri);
    setPhotoState('uploading');
    try {
      const path = `${account!.user_id}/profile-${Date.now()}.jpg`;
      await uploadImage('vendor-photos', path, r.uri);
      setPhotoPath(path);
      setPhotoState('uploaded');
    } catch {
      setPhotoState('failed');
    }
  };

  const submit = async () => {
    if (name.trim().length < 3) {
      setNameError(en.vendor.displayNameError);
      return;
    }
    const parsed = vendorProfileSchema.safeParse({ display_name: name, vehicle, vehicle_no: vehicleNo, pmc_vendor_id: pmcId, delivery_available: delivery, allow_calls: calls });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? en.errors.unknown);
      return;
    }
    setBusy(true);
    try {
      await saveVendorProfile({ ...parsed.data, photo_path: photoPath });
      await invalidate(vendorKeys.me);
      if (v) router.back();
      else router.replace('/vendor-setup/items');
    } catch {
      setError(en.errors.unknown);
    } finally {
      setBusy(false);
    }
  };

  const card = (kind: 'tempo' | 'thela', label: string, icon: typeof Truck) => {
    const on = vehicle === kind;
    return (
      <Pressable
        testID={`vehicle-${kind}`}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={label}
        onPress={() => setVehicle(kind)}
        style={{ flex: 1, alignItems: 'center', gap: t.spacing.xs, padding: t.spacing.md, borderRadius: t.radius.card, borderWidth: on ? 2 : 1, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: t.colors.surface }}
      >
        {kind === 'thela' ? <Image source={VENDOR_ART.thela} resizeMode="contain" style={{ width: 56, height: 44 }} /> : <Icon icon={icon} size={40} color={on ? 'primary' : 'textSecondary'} />}
        <Text variant="label" weight="600">{label}</Text>
      </Pressable>
    );
  };

  return (
    <Screen
      header={<TopAppBar title={en.vendor.detailsTitle} onBack={v ? () => router.back() : undefined} />}
      footer={<Button size="xl" label={en.common.continue} disabled={!name.trim() || !vehicle || photoState === 'uploading'} loading={busy} onPress={submit} testID="details-continue" />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <View style={{ width: 96 }}>
          {photoState === 'uploaded' && photoUri ? (
            <Pressable onPress={takePhoto} accessibilityLabel={en.vendor.addPhoto}>
              <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            </Pressable>
          ) : (
            <PhotoUploader state={photoState} uri={photoUri} progress={0.64} onPress={takePhoto} onRetry={takePhoto} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="600" color={photoState === 'failed' ? 'error' : 'primary'}>
            {photoState === 'uploading' ? en.vendor.uploadingPhoto : photoState === 'failed' ? en.vendor.photoFailed : en.vendor.addPhoto}
          </Text>
          {photoState === 'uploading' ? <Text variant="caption" color="textSecondary">{en.vendor.keepFilling}</Text> : null}
          {photoState === 'failed' ? <Text variant="caption" color="textSecondary">{en.vendor.tapToRetry}</Text> : null}
        </View>
      </View>
      <TextInput label={en.vendor.displayName} placeholder={en.vendor.displayNamePh} value={name} onChangeText={(x) => { setName(x); setNameError(null); }} error={nameError} testID="display-name" />
      <Text weight="600">{en.vendor.sellFrom}</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        {card('tempo', en.vendor.tempo, Truck)}
        {card('thela', en.vendor.thela, ShoppingCart)}
      </View>
      <TextInput label={en.vendor.vehicleNo} placeholder="MH 12 AB 4521" value={vehicleNo} onChangeText={setVehicleNo} autoCapitalize="characters" />
      <TextInput label={en.vendor.pmcId} placeholder="PMC/HWK/2023/0000" value={pmcId} onChangeText={setPmcId} autoCapitalize="characters" />
      <Card>
        <Checkbox label={en.vendor.canDeliver} value={delivery} onChange={setDelivery} />
        <Toggle label={en.vendor.allowCalls} description={en.vendor.allowCallsHint} value={calls} onChange={setCalls} />
      </Card>
      {error ? <Text color="error">{error}</Text> : null}
    </Screen>
  );
}
