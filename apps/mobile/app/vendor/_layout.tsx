import { Stack } from 'expo-router';
import { TypeModeScope, useTheme } from '../../src/theme/ThemeProvider';

export default function VendorStackLayout() {
  const t = useTheme();
  return (
    <TypeModeScope mode="vendor">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }} />
    </TypeModeScope>
  );
}
