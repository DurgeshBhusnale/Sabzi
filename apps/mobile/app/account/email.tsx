import { router } from 'expo-router';
import { useState } from 'react';
import { Button, OtpInput, Screen, Snackbar, Text, TextInput, TopAppBar } from '../../src/ui';
import { addEmail, verifyEmailChange } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-11: add an email, then the 6-digit code. */
export default function AddEmail() {
  const { account, refresh } = useSession();
  const [email, setEmail] = useState(account?.pending_email ?? '');
  const [sent, setSent] = useState(!!account?.pending_email);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Screen header={<TopAppBar title={en.profile.addEmailTitle} onBack={() => router.back()} />}>
      {done ? <Snackbar kind="success" message={en.profile.emailVerified} /> : null}
      {!sent ? (
        <>
          <TextInput label={en.auth.emailLabel} kind="email" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} error={error} />
          <Button
            label={en.auth.sendCode}
            loading={busy}
            disabled={!email.includes('@')}
            onPress={async () => {
              setBusy(true);
              const r = await addEmail(email);
              setBusy(false);
              if (r.ok) setSent(true);
              else setError((en.errors as Record<string, string>)[r.code] ?? en.errors.unknown);
            }}
          />
        </>
      ) : (
        <>
          <Text color="textSecondary">{en.auth.codeSentTo(email)}</Text>
          <OtpInput
            value={code}
            state={error ? 'error' : done ? 'success' : 'default'}
            message={error ?? (done ? en.auth.verified : null)}
            onChange={async (v) => {
              setCode(v);
              setError(null);
              if (v.length < 6) return;
              const r = await verifyEmailChange(email, v);
              if (r.ok) {
                setDone(true);
                await refresh();
              } else setError(en.errors.otp_invalid);
            }}
          />
        </>
      )}
    </Screen>
  );
}
