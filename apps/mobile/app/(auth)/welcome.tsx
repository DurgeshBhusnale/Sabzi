import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, ILLUSTRATION_ART, Text } from '../../src/ui';
import { en } from '../../src/i18n/en';
import { useSession } from '../../src/features/auth/session';

/** Slide art from the v4 image pack, in the order the welcome frames use. */
const ART = [ILLUSTRATION_ART.getAlert, ILLUSTRATION_ART.shopDoorstep, ILLUSTRATION_ART.pickSociety];

/** S-02: three slides — illustration panel on top, title, dots, Get started / Log in. Skip on slides 1 and 2. */
export default function Welcome() {
  const t = useTheme();
  const { markSeen } = useSession();
  const [i, setI] = useState(0);
  // TECH-02: sign-in replaces the slides, so Android back from sign-in leaves the app instead of returning here,
  // and later signed-out starts skip the slides.
  const insets = useSafeAreaInsets();
  const toSignIn = () => {
    markSeen();
    router.replace('/(auth)/signin');
  };
  const slide = en.welcome.slides[i]!;
  const last = i === en.welcome.slides.length - 1;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ height: 440, backgroundColor: t.colors.artPanel, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={{ height: 48, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: t.spacing.screen }}>
            {!last ? (
              <Pressable accessibilityRole="button" onPress={() => setI(en.welcome.slides.length - 1)} hitSlop={12} style={{ minHeight: 48, justifyContent: 'center' }}>
                <Text variant="label" color="primary">{en.welcome.skip}</Text>
              </Pressable>
            ) : null}
          </View>
          <Image source={ART[i]} resizeMode="contain" style={{ flex: 1, width: '100%' }} accessible={false} testID={`welcome-art-${i}`} />
        </SafeAreaView>
      </View>
      <View style={{ flex: 1, paddingHorizontal: t.spacing.screen, paddingTop: 28, paddingBottom: t.spacing.xl + insets.bottom, gap: t.spacing.lg }}>
        <Text variant="display" accessibilityRole="header">{slide.title}</Text>
        {slide.body ? <Text variant="bodySmall" color="textSecondary">{slide.body}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Slide ${i + 1} of 3`}>
          {en.welcome.slides.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? t.colors.primary : t.colors.border }} />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ gap: t.spacing.xs }}>
          <Button label={last ? en.welcome.getStarted : en.welcome.next} onPress={() => (last ? toSignIn() : setI(i + 1))} testID="welcome-next" />
          <Button label={en.welcome.haveAccount} variant="tertiary" onPress={toSignIn} testID="welcome-login" />
        </View>
      </View>
    </View>
  );
}
