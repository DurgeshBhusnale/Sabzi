import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { AUTH_METHODS, PUBLIC_BASE_URL } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, Checkbox, Screen, Text, TopAppBar } from '../../src/ui';
import { Logo } from '../../src/features/system/Splash';
import { signInWithGoogle } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/**
 * Sign-in (replaces S-03 while SMS OTP waits for DLT): Google via Supabase OAuth, with the DPDP consent
 * checkbox. Phone and email entry points appear only when enabled in AUTH_METHODS.
 */
export default function SignIn({ google = signInWithGoogle }: { google?: typeof signInWithGoogle }) {
  const t = useTheme();
  const { refresh } = useSession();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    const r = await google();
    setBusy(false);
    if (r.ok) {
      track('signup_completed', { method: 'google' });
      await refresh();
      router.replace('/');
      return;
    }
    setError(r.code === 'cancelled' ? en.auth.googleCancelled : r.code === 'network' ? en.errors.network : en.auth.googleFailed);
  };

  return (
    <Screen
      header={<TopAppBar onBack={router.canGoBack() ? () => router.back() : undefined} />}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button label={busy ? en.auth.signingIn : en.auth.continueGoogle} onPress={go} loading={busy} disabled={!consent} testID="google-signin" />
          {/* FUTURE: phone OTP sign-in (needs DLT registration for SMS). Turn on with AUTH_METHODS.phoneOtp. */}
          {AUTH_METHODS.phoneOtp ? <Button label={en.auth.phoneTitle} variant="secondary" onPress={() => router.push('/(auth)/phone')} /> : null}
          {AUTH_METHODS.emailOtp ? <Button label={en.auth.useEmail} variant="tertiary" onPress={() => router.push('/(auth)/email')} /> : null}
        </View>
      }
    >
      <Logo size={40} />
      <Text variant="h1" accessibilityRole="header">{en.auth.signInTitle}</Text>
      <Text color="textSecondary">{en.auth.signInBody}</Text>
      {error ? <Banner kind="error" message={error} testID="signin-error" /> : null}
      <Checkbox label={en.auth.consent} value={consent} onChange={setConsent} testID="consent" />
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <Button label={en.auth.termsLink} variant="tertiary" fullWidth={false} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/terms`)} />
        <Button label={en.auth.privacyLink} variant="tertiary" fullWidth={false} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/privacy`)} />
      </View>
    </Screen>
  );
}
