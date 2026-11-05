import { Stack } from 'expo-router';
import { TypeModeScope, useTheme } from '../../src/theme/ThemeProvider';
import { useSession } from '../../src/features/auth/session';

export default function AccountLayout() {
  const t = useTheme();
  const { account } = useSession();
  return (
    <TypeModeScope mode={account?.role === 'vendor' ? 'vendor' : 'buyer'}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }} />
    </TypeModeScope>
  );
}
