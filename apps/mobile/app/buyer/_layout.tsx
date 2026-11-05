import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function BuyerStackLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }} />;
}
