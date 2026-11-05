import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, EmptyState, Screen, Snackbar, TextInput, TopAppBar } from '../../src/ui';
import { joinWaitlist } from '../../src/features/buyer/api';
import { en } from '../../src/i18n/en';

/** B-02 / X-17: not served yet + waitlist. */
export default function NotServed() {
  const t = useTheme();
  const params = useLocalSearchParams<{ name?: string; id?: string }>();
  const [name, setName] = useState(params.name ?? '');
  const [vendor, setVendor] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      header={<TopAppBar onBack={() => router.back()} />}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          {saved ? <Snackbar kind="success" message={en.buyer.savedWaitlist} /> : (
            <Button
              label={en.buyer.notifyMe}
              disabled={name.trim().length < 2}
              loading={busy}
              testID="join-waitlist"
              onPress={async () => {
                setBusy(true);
                try {
                  await joinWaitlist(name.trim(), params.id ?? null, vendor.trim() || undefined);
                  setSaved(true);
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
          <Button label={en.buyer.pickAnother} variant={saved ? 'secondary' : 'tertiary'} onPress={() => router.replace('/buyer-setup/society')} />
        </View>
      }
    >
      <EmptyState illustration="pin" title={en.buyer.notServedTitle(name || '…')} body={en.buyer.notServedBody} testID="b02" />
      {!params.id ? <TextInput label={en.buyer.yourSocietyName} value={name} onChangeText={setName} /> : null}
      <TextInput label={en.buyer.vendorHint} value={vendor} onChangeText={setVendor} />
    </Screen>
  );
}
