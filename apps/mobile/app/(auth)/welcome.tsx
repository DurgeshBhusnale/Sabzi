import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Bell, ShoppingBasket, Star } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Icon, Screen, Text } from '../../src/ui';
import { Logo } from '../../src/features/system/Splash';
import { en } from '../../src/i18n/en';

const ICONS = [Bell, ShoppingBasket, Star];

/** S-02: three short slides with Get started / Log in, and Skip. */
export default function Welcome() {
  const t = useTheme();
  const [i, setI] = useState(0);
  const slide = en.welcome.slides[i]!;
  const last = i === en.welcome.slides.length - 1;
  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button label={last ? en.welcome.getStarted : en.welcome.next} onPress={() => (last ? router.push('/(auth)/signin') : setI(i + 1))} testID="welcome-next" />
          <Button label={en.welcome.logIn} variant="tertiary" onPress={() => router.push('/(auth)/signin')} />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={32} />
        {!last ? <Button label={en.welcome.skip} variant="tertiary" fullWidth={false} onPress={() => setI(en.welcome.slides.length - 1)} /> : null}
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: t.spacing.md }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: t.colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={ICONS[i]!} size={72} color="brandLeaf" />
        </View>
        <Text variant="h1" align="center" accessibilityRole="header">{slide.title}</Text>
        <Text color="textSecondary" align="center">{slide.body}</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.xs }} accessibilityLabel={`Slide ${i + 1} of 3`}>
          {en.welcome.slides.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? t.colors.primary : t.colors.border }} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
