import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Screen, Text, TextInput } from '../../src/ui';
import { completeProfile, completeProfileWithPhone } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { AppErrorException } from '../../src/lib/errors';
import { en } from '../../src/i18n/en';

/**
 * S-07 profile building: name (prefilled from Google) and mobile number. The number is saved without SMS
 * verification while phone OTP is off; users who signed in with phone OTP already have a verified number.
 */
export default function ProfileStep() {
  const { refresh, account } = useSession();
  const needsPhone = account?.has_phone === false;
  const [name, setName] = useState(account?.name ?? '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<{ field: 'name' | 'phone' | 'form'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const phoneOk = !needsPhone || /^[6-9]\d{9}$/.test(phone);
  return (
    <Screen
      footer={
        <Button
          label={en.common.continue}
          disabled={name.trim().length < 2 || !phoneOk}
          loading={busy}
          testID="name-continue"
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              if (needsPhone) await completeProfileWithPhone(name, phone);
              else await completeProfile(name);
              await refresh();
              router.replace({ pathname: '/(auth)/notify', params: { role: account?.role ?? 'buyer' } });
            } catch (e) {
              const code = e instanceof AppErrorException ? e.appError.code : 'unknown';
              setError({ field: code === 'invalid_phone' ? 'phone' : code === 'invalid_name' ? 'name' : 'form', msg: e instanceof AppErrorException ? e.message : en.errors.unknown });
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <Text variant="h1" accessibilityRole="header">{needsPhone ? en.auth.profileTitle : en.auth.nameTitle}</Text>
      {needsPhone ? <Text color="textSecondary">{account?.role === 'vendor' ? en.auth.profileBodyVendor : en.auth.profileBody}</Text> : null}
      <TextInput label={en.auth.nameLabel} placeholder={en.auth.namePlaceholder} value={name} onChangeText={setName} error={error?.field === 'name' ? error.msg : null} autoCapitalize="words" testID="name-input" />
      {needsPhone ? (
        <TextInput
          label={en.auth.mobileLabel}
          kind="phone"
          placeholder={en.auth.phonePlaceholder}
          helper={en.auth.mobileHint}
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, ''))}
          error={error?.field === 'phone' ? error.msg : phone.length === 10 && !phoneOk ? en.errors.invalid_phone : null}
          testID="mobile-input"
        />
      ) : null}
      {error?.field === 'form' ? <Text color="error">{error.msg}</Text> : null}
    </Screen>
  );
}
