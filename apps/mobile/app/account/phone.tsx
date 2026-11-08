import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Screen, Snackbar, Text, TextInput, TopAppBar } from '../../src/ui';
import { setMyPhone } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { AppErrorException } from '../../src/lib/errors';
import { en } from '../../src/i18n/en';

/** Add or change the mobile number (no SMS check while phone OTP is off). */
export default function EditPhone() {
  const { account, refresh } = useSession();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = /^[6-9]\d{9}$/.test(phone);
  return (
    <Screen
      header={<TopAppBar title={account?.phone_last4 ? en.profile.editMobile : en.profile.addMobile} onBack={() => router.back()} />}
      footer={
        <Button
          label={en.common.save}
          disabled={!valid}
          loading={busy}
          testID="save-phone"
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await setMyPhone(phone);
              await refresh();
              setSaved(true);
            } catch (e) {
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      {saved ? <Snackbar kind="success" message={en.profile.mobileSaved} /> : null}
      <Text color="textSecondary">{en.auth.profileBody}</Text>
      <TextInput label={en.auth.mobileLabel} kind="phone" placeholder={en.auth.phonePlaceholder} helper={en.auth.mobileHint} value={phone} onChangeText={(v) => setPhone(v.replace(/\D/g, ''))} error={error ?? (phone.length === 10 && !valid ? en.errors.invalid_phone : null)} testID="phone-edit" />
    </Screen>
  );
}
