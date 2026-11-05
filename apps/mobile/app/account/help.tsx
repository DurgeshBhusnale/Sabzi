import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Screen, Text, TopAppBar } from '../../src/ui';
import { en } from '../../src/i18n/en';

/** S-14: FAQ list and support contacts. */
export default function Help() {
  const t = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen header={<TopAppBar title={en.help.title} onBack={() => router.back()} />}>
      <Card style={{ gap: t.spacing.xs }}>
        {en.help.faqs.map((f, i) => (
          <Pressable key={f.q} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ minHeight: t.layout.minTouch, paddingVertical: t.spacing.xs, gap: t.spacing.xxs }}>
            <Text weight="600">{f.q}</Text>
            {open === i ? <Text color="textSecondary">{f.a}</Text> : null}
          </Pressable>
        ))}
      </Card>
      <View style={{ gap: t.spacing.xs }}>
        <Button label={en.help.call} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
        <Button label={en.help.whatsapp} variant="secondary" onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`)} />
        <Button label={en.help.email} variant="tertiary" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </View>
    </Screen>
  );
}
