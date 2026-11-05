import { router } from 'expo-router';
import { Linking, Share } from 'react-native';
import { SUPPORT_PHONE } from '@sabzi/shared';
import { Button, QrCard, Screen, SkeletonBlock, TopAppBar, vendorQrUrl } from '../../src/ui';
import { useMyVendor } from '../../src/features/vendor/hooks';
import { en } from '../../src/i18n/en';

/** V-15 (VEN-12): the same code is printed on the sticker by the admin. */
export default function MyQr() {
  const vendor = useMyVendor();
  const v = vendor.data;
  const share = () => v && Share.share({ message: en.vendor.shareText(v.display_name, vendorQrUrl(v.code)) });
  return (
    <Screen header={<TopAppBar title={en.vendor.qrTitle} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(vendor)/today'))} />}>
      {v ? <QrCard name={v.display_name} code={v.code} size="large" /> : <SkeletonBlock kind="vendorCard" />}
      <Button size="xl" label={en.qr.share} onPress={share} testID="share-qr" />
      <Button label={en.vendor.askSticker} variant="secondary" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
    </Screen>
  );
}
