import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { produceArtKey, produceTileGround, type ProduceArtKey } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** Produce cut-outs from the v4 image pack (A01–A30), resized by scripts/process-design-images.mjs. */
const PRODUCE: Record<ProduceArtKey, ImageSourcePropType> = {
  tomato: require('../../assets/images/produce/tomato.webp'),
  onion: require('../../assets/images/produce/onion.webp'),
  potato: require('../../assets/images/produce/potato.webp'),
  'palak-spinach': require('../../assets/images/produce/palak-spinach.webp'),
  coriander: require('../../assets/images/produce/coriander.webp'),
  'methi-fenugreek': require('../../assets/images/produce/methi-fenugreek.webp'),
  'bhindi-okra': require('../../assets/images/produce/bhindi-okra.webp'),
  carrot: require('../../assets/images/produce/carrot.webp'),
  capsicum: require('../../assets/images/produce/capsicum.webp'),
  cabbage: require('../../assets/images/produce/cabbage.webp'),
  cauliflower: require('../../assets/images/produce/cauliflower.webp'),
  'brinjal-baingan': require('../../assets/images/produce/brinjal-baingan.webp'),
  cucumber: require('../../assets/images/produce/cucumber.webp'),
  lemon: require('../../assets/images/produce/lemon.webp'),
  ginger: require('../../assets/images/produce/ginger.webp'),
  'green-chilli': require('../../assets/images/produce/green-chilli.webp'),
  'green-peas': require('../../assets/images/produce/green-peas.webp'),
  corn: require('../../assets/images/produce/corn.webp'),
  'bottle-gourd-lauki': require('../../assets/images/produce/bottle-gourd-lauki.webp'),
  beetroot: require('../../assets/images/produce/beetroot.webp'),
  banana: require('../../assets/images/produce/banana.webp'),
  apple: require('../../assets/images/produce/apple.webp'),
  mango: require('../../assets/images/produce/mango.webp'),
  papaya: require('../../assets/images/produce/papaya.webp'),
  pomegranate: require('../../assets/images/produce/pomegranate.webp'),
  grapes: require('../../assets/images/produce/grapes.webp'),
  watermelon: require('../../assets/images/produce/watermelon.webp'),
  'orange-santra': require('../../assets/images/produce/orange-santra.webp'),
  guava: require('../../assets/images/produce/guava.webp'),
  'sweet-lime-mosambi': require('../../assets/images/produce/sweet-lime-mosambi.webp'),
};

export const VENDOR_ART = {
  basket: require('../../assets/images/produce/mixed-vegetable-basket.webp') as ImageSourcePropType,
  fruitCrate: require('../../assets/images/produce/fruit-crate.webp') as ImageSourcePropType,
  thela: require('../../assets/images/produce/vendor-handcart-thela.webp') as ImageSourcePropType,
};

/** Illustrations C01–C15 (C14 is admin only). */
export const ILLUSTRATION_ART = {
  pickSociety: require('../../assets/images/illustrations/onboarding-1-pick-your-society.webp'),
  getAlert: require('../../assets/images/illustrations/onboarding-2-get-the-alert.webp'),
  shopDoorstep: require('../../assets/images/illustrations/onboarding-3-shop-at-your-doorstep.webp'),
  notFollowing: require('../../assets/images/illustrations/empty-not-following-anyone.webp'),
  noRequests: require('../../assets/images/illustrations/empty-no-requests.webp'),
  noNotifications: require('../../assets/images/illustrations/empty-no-notifications.webp'),
  noResults: require('../../assets/images/illustrations/empty-no-search-results.webp'),
  offline: require('../../assets/images/illustrations/system-offline.webp'),
  error: require('../../assets/images/illustrations/system-error.webp'),
  maintenance: require('../../assets/images/illustrations/system-maintenance.webp'),
  success: require('../../assets/images/illustrations/system-success.webp'),
  menuPublished: require('../../assets/images/illustrations/vendor-menu-published.webp'),
  arrived: require('../../assets/images/illustrations/vendor-arrived-at-stop.webp'),
  splash: require('../../assets/images/illustrations/splash-app-launch.webp'),
} as const satisfies Record<string, ImageSourcePropType>;
export type IllustrationArt = keyof typeof ILLUSTRATION_ART;

export const PHOTO_ART = {
  eveningDeal: require('../../assets/images/photos/evening-deal-banner.webp') as ImageSourcePropType,
};

export const APP_ICON = require('../../assets/images/brand/app-icon.png') as ImageSourcePropType;

export function produceSource(name: string): ImageSourcePropType | null {
  const key = produceArtKey(name);
  return key ? PRODUCE[key] : null;
}

/**
 * Produce tile (v4): rounded square on a soft ground with the produce cut-out,
 * or the first letter in Newsreader when the item has no picture.
 */
export function ItemArt({ name, size = 36, muted = false }: { name: string; size?: number; muted?: boolean }) {
  const t = useTheme();
  const src = produceSource(name);
  const ground = muted ? t.colors.surface2 : t.scheme === 'dark' ? t.colors.artTint : produceTileGround(name);
  const letter = name.replace(/\(.*\)/, '').trim().charAt(0).toUpperCase();
  return (
    <View
      accessible={false}
      testID={src ? 'item-art-image' : 'item-art-letter'}
      style={[styles.center, { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: ground, opacity: muted ? 0.6 : 1 }]}
    >
      {src ? (
        <Image source={src} resizeMode="contain" style={{ width: size * 0.86, height: size * 0.86 }} />
      ) : (
        <Text variant={size >= 48 ? 'h1' : 'price'} color={muted ? 'textMuted' : 'artText'} style={{ fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.6) }}>
          {letter}
        </Text>
      )}
    </View>
  );
}

/** Full illustration from the image pack, square, with soft corners (art has a cream ground). */
export function IllustrationImage({ art, size = 220, testID }: { art: IllustrationArt; size?: number; testID?: string }) {
  const t = useTheme();
  return (
    <Image
      testID={testID ?? `illustration-${art}`}
      accessibilityIgnoresInvertColors
      accessible={false}
      source={ILLUSTRATION_ART[art]}
      resizeMode="cover"
      style={{ width: size, height: size, borderRadius: t.radius.dialog }}
    />
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
