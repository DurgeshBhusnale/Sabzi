import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Screen, Text, TextInput } from '../../src/ui';
import { completeProfile } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { AppErrorException } from '../../src/lib/errors';
import { en } from '../../src/i18n/en';

/** S-07: name (vendors add their photo in V-01). Then permission rationale S-08. */
export default function NameScreen() {
  const { refresh, account } = useSession();
  const [name, setName] = useState(account?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      footer={
        <Button
          label={en.common.continue}
          disabled={name.trim().length < 2}
          loading={busy}
          testID="name-continue"
          onPress={async () => {
            setBusy(true);
            try {
              await completeProfile(name);
              await refresh();
              router.replace({ pathname: '/(auth)/notify', params: { role: account?.role ?? 'buyer' } });
            } catch (e) {
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <Text variant="h1" accessibilityRole="header">{en.auth.nameTitle}</Text>
      <TextInput label={en.auth.nameLabel} placeholder={en.auth.namePlaceholder} value={name} onChangeText={setName} error={error} autoCapitalize="words" testID="name-input" autoFocus />
    </Screen>
  );
}
