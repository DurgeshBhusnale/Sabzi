import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { formatDuration, PUBLIC_BASE_URL } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, Checkbox, Screen, Text, TextInput, TopAppBar } from '../../src/ui';
import { sendPhoneOtp } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-03 (and X-16 / X-07 states): +91 number, consent, Send OTP. */
export default function PhoneScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ expired?: string }>();
  const { lastPhone, setLastPhone } = useSession();
  const [phone, setPhone] = useState(lastPhone);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntilRaw] = useState<string | null>(null);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const setBlockedUntil = (iso: string) => {
    setBlockedUntilRaw(iso);
    setMinutesLeft(Math.max(1, (Date.parse(iso) - Date.now()) / 60000));
  };
  const [sending, setSending] = useState(false);
  const valid = /^[6-9]\d{9}$/.test(phone);

  const send = async () => {
    setSending(true);
    setError(null);
    const r = await sendPhoneOtp(phone);
    setSending(false);
    if (r.ok) {
      setLastPhone(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } else if (r.code === 'otp_blocked' && 'blockedUntil' in r) {
      setBlockedUntil(r.blockedUntil);
    } else {
      setError((en.errors as Record<string, string>)[r.code] ?? en.errors.unknown);
    }
  };

  return (
    <Screen
      header={<TopAppBar onBack={router.canGoBack() ? () => router.back() : undefined} />}
      footer={<Button label={en.auth.sendOtp} onPress={send} loading={sending} disabled={!valid || !consent || !!blockedUntil} testID="send-otp" />}
    >
      {params.expired ? <Banner kind="info" message={en.auth.sessionExpired} /> : null}
      <Text variant="h1" accessibilityRole="header">{en.auth.phoneTitle}</Text>
      <Text color="textSecondary">{en.auth.phoneBody}</Text>
      <TextInput
        label={en.auth.phoneLabel}
        kind="phone"
        placeholder={en.auth.phonePlaceholder}
        value={phone}
        onChangeText={(v) => {
          setPhone(v.replace(/\D/g, ''));
          setError(null);
        }}
        error={phone.length === 10 && !valid ? en.errors.invalid_phone : error}
        testID="phone-input"
        autoFocus
      />
      {blockedUntil ? (
        <View style={{ gap: t.spacing.xs }}>
          <Banner kind="error" message={en.auth.tooMany(formatDuration(minutesLeft))} testID="otp-blocked" />
          <Button label={en.auth.useEmail} variant="secondary" onPress={() => router.push('/(auth)/email')} />
        </View>
      ) : null}
      <Checkbox label={en.auth.consent} value={consent} onChange={setConsent} testID="consent" />
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <Button label={en.auth.termsLink} variant="tertiary" fullWidth={false} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/terms`)} />
        <Button label={en.auth.privacyLink} variant="tertiary" fullWidth={false} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/privacy`)} />
      </View>
      <Button label={en.auth.useEmail} variant="tertiary" onPress={() => router.push('/(auth)/email')} />
    </Screen>
  );
}
