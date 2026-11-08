import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AUTH_METHODS, LIMITS } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, OtpInput, Screen, Text, TextInput, TopAppBar } from '../../src/ui';
import { sendEmailOtp, verifyEmailOtp } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/**
 * S-05 email sign-in / sign-up: email → 6-digit code → signed in (new emails get a new account).
 * Then role → profile building (name + mobile number) like Google users.
 */
export default function EmailLogin({ send = sendEmailOtp, verify = verifyEmailOtp }: { send?: typeof sendEmailOtp; verify?: typeof verifyEmailOtp }) {
  const t = useTheme();
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const doSend = async () => {
    setBusy(true);
    setError(null);
    const r = await send(email);
    setBusy(false);
    if (r.ok) {
      setSent(true);
      setSeconds(LIMITS.otpResendSeconds);
    } else setError((en.errors as Record<string, string>)[r.code] ?? en.errors.unknown);
  };

  const onCode = async (v: string) => {
    setCode(v);
    setError(null);
    if (v.length < 6) return;
    setBusy(true);
    const r = await verify(email, v);
    setBusy(false);
    if (r.ok) {
      track('signup_completed', { method: 'email' });
      await refresh();
      router.replace('/');
    } else setError(r.code === 'otp_invalid' ? en.errors.email_otp_invalid : (en.errors as Record<string, string>)[r.code] ?? en.errors.email_otp_invalid);
  };

  return (
    <Screen header={<TopAppBar onBack={() => (sent ? setSent(false) : router.back())} />}>
      <Text variant="h1" accessibilityRole="header">{en.auth.emailTitle}</Text>
      <Text color="textSecondary">{sent ? en.auth.codeSentTo(email.trim()) : en.auth.emailBody}</Text>
      {!sent ? (
        <>
          <TextInput label={en.auth.emailLabel} kind="email" autoComplete="email" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} error={error} testID="email-input" autoFocus />
          <Button label={en.auth.sendCode} onPress={doSend} loading={busy} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} testID="send-email-code" />
        </>
      ) : (
        <View style={{ gap: t.spacing.sm }}>
          <OtpInput value={code} onChange={onCode} state={error ? 'error' : 'default'} message={error ?? (busy ? en.auth.verifying : null)} autoFocus testID="email-otp" />
          <Text variant="caption" color="textMuted">{en.auth.checkSpam}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text color="textSecondary">{seconds > 0 ? en.auth.resendIn(seconds) : en.auth.didntGet}</Text>
            <Button label={en.auth.resend} variant="tertiary" fullWidth={false} disabled={seconds > 0} onPress={doSend} testID="resend-email" />
          </View>
        </View>
      )}
      {/* FUTURE: phone OTP entry point, shown again when AUTH_METHODS.phoneOtp is turned on. */}
      {AUTH_METHODS.phoneOtp ? <Button label={en.auth.usePhone} variant="tertiary" onPress={() => router.replace('/(auth)/phone')} /> : null}
    </Screen>
  );
}
