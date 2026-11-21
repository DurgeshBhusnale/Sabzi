import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { societyRequestSchema } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, EmptyState, Screen, TextInput, TopAppBar } from '../../src/ui';
import { requestSociety } from '../../src/features/buyer/api';
import { AppErrorException } from '../../src/lib/errors';
import { en } from '../../src/i18n/en';

/**
 * B-02 / X-17 (owner review 2026-11-21): ask the team to add a society. A new society needs its name and address
 * (both required); a listed society that has no vendors yet only needs the tap. Never saves the society to the
 * account. On success, the confirmation screen leads back to the picker.
 */
export default function NotServed() {
  const t = useTheme();
  const params = useLocalSearchParams<{ name?: string; id?: string }>();
  const societyId = params.id || null;
  const [name, setName] = useState(params.name ?? '');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const check = societyRequestSchema.safeParse({ name, address, society_id: societyId });
  return (
    <Screen
      header={<TopAppBar onBack={() => router.back()} />}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button
            label={en.buyer.notifyMe(name)}
            disabled={!check.success}
            loading={busy}
            testID="join-waitlist"
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await requestSociety({ name, address, societyId });
                router.replace({ pathname: '/buyer-setup/requested', params: { name: name.trim() } });
              } catch (e) {
                setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button label={en.buyer.pickAnother} variant="tertiary" onPress={() => router.replace('/buyer-setup/society')} testID="pick-another" />
        </View>
      }
    >
      <EmptyState illustration="door" title={en.buyer.notServedTitle(name.trim() || '…')} body={en.buyer.notServedBody} testID="b02" />
      {!societyId ? (
        <>
          <TextInput label={en.buyer.yourSocietyName} placeholder={en.buyer.societyNamePh} value={name} onChangeText={setName} maxChars={80} autoCapitalize="words" testID="society-name" />
          <TextInput label={en.buyer.societyAddress} placeholder={en.buyer.societyAddressPh} value={address} onChangeText={setAddress} maxChars={200} kind="multiline" testID="society-address" />
        </>
      ) : null}
      {error ? <Banner kind="error" message={error} /> : null}
    </Screen>
  );
}
