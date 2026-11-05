import { router } from 'expo-router';
import { useState } from 'react';
import { Button, OtpInput, Screen, Text, TextInput, TopAppBar } from '../../src/ui';
import { sendEmailOtp, verifyEmailOtp } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-05: email login for users who already verified an email. */
export default function EmailLogin() {
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    const r = await sendEmailOtp(email);
    setBusy(false);
    if (r.ok) setSent(true);
    else setError((en.errors as Record<string, string>)[r.code] ?? en.errors.unknown);
  };

  const verify = async (v: string) => {
    setCode(v);
    setError(null);
    if (v.length < 6) return;
    setBusy(true);
    const r = await verifyEmailOtp(email, v);
    setBusy(false);
    if (r.ok) {
      await refresh();
      router.replace('/');
    } else setError((en.errors as Record<string, string>)[r.code] ?? en.errors.otp_invalid);
  };

  return (
    <Screen header={<TopAppBar onBack={() => router.back()} />}>
      <Text variant="h1" accessibilityRole="header">{en.auth.emailTitle}</Text>
      <Text color="textSecondary">{sent ? en.auth.codeSentTo(email) : en.auth.emailBody}</Text>
      {!sent ? (
        <>
          <TextInput label={en.auth.emailLabel} kind="email" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} error={error} testID="email-input" />
          <Button label={en.auth.sendCode} onPress={send} loading={busy} disabled={!email.includes('@')} />
        </>
      ) : (
        <OtpInput value={code} onChange={verify} state={error ? 'error' : 'default'} message={error} autoFocus />
      )}
      <Button label={en.auth.usePhone} variant="tertiary" onPress={() => router.replace('/(auth)/phone')} />
    </Screen>
  );
}
