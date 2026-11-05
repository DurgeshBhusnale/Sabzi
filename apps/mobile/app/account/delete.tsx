import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Screen, Text, TextInput, TopAppBar } from '../../src/ui';
import { deleteAccount } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-16: explain, type DELETE, destructive button, farewell. */
export default function DeleteAccount() {
  const t = useTheme();
  const { account, refresh } = useSession();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen
      header={<TopAppBar title={en.settings.deleteTitle} onBack={() => router.back()} />}
      footer={
        <Button
          label={busy ? en.settings.deleting : en.settings.deleteButton}
          variant="destructive"
          loading={busy}
          disabled={typed.trim() !== 'DELETE'}
          testID="confirm-delete"
          onPress={async () => {
            setBusy(true);
            try {
              await deleteAccount();
              router.replace('/account/farewell');
              await refresh();
            } catch {
              setError(en.errors.unknown);
              setBusy(false);
            }
          }}
        />
      }
    >
      <Card style={{ gap: t.spacing.xs }}>
        {[...en.settings.deleteWhat, ...(account?.role === 'vendor' ? [en.settings.deleteVendorExtra] : [])].map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: t.spacing.xs }}>
            <Text>•</Text>
            <Text style={{ flex: 1 }}>{l}</Text>
          </View>
        ))}
      </Card>
      <TextInput label={en.settings.typeDelete} value={typed} onChangeText={setTyped} autoCapitalize="characters" error={error} testID="type-delete" />
    </Screen>
  );
}
