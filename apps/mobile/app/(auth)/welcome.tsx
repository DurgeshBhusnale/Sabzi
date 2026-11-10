import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, ILLUSTRATION_ART, Text } from '../../src/ui';
import { en } from '../../src/i18n/en';

/** Slide art from the v4 image pack, in the order the welcome frames use. */
const ART = [ILLUSTRATION_ART.getAlert, ILLUSTRATION_ART.shopDoorstep, ILLUSTRATION_ART.pickSociety];

/** S-02: three slides — illustration panel on top, title, dots, Get started / Log in. Skip on slides 1 and 2. */
export default function Welcome() {
  const t = useTheme();
  const [i, setI] = useState(0);
  const slide = en.welcome.slides[i]!;
  const last = i === en.welcome.slides.length - 1;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ height: 440, backgroundColor: t.scheme === 'dark' ? t.colors.surface2 : '#F3F2E6', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
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
      <View style={{ flex: 1, paddingHorizontal: t.spacing.screen, paddingTop: 28, paddingBottom: t.spacing.xl, gap: t.spacing.lg }}>
        <Text variant="h1" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>{slide.title}</Text>
        {slide.body ? <Text variant="bodySmall" color="textSecondary">{slide.body}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Slide ${i + 1} of 3`}>
          {en.welcome.slides.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? t.colors.primary : t.colors.border }} />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ gap: t.spacing.xs }}>
          <Button label={last ? en.welcome.getStarted : en.welcome.next} onPress={() => (last ? router.push('/(auth)/signin') : setI(i + 1))} testID="welcome-next" />
          <Button label={en.welcome.logIn} variant="tertiary" onPress={() => router.push('/(auth)/signin')} />
        </View>
      </View>
    </View>
  );
}
