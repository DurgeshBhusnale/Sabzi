import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import type { TextStyleToken } from '@sabzi/shared';

/** Font files registered in the root layout. */
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

const familyByWeight: Record<string, Record<string, string>> = {
  Inter: { '400': 'Inter_400Regular', '500': 'Inter_500Medium', '600': 'Inter_600SemiBold', '700': 'Inter_700Bold' },
  PlusJakartaSans: { '400': 'PlusJakartaSans_600SemiBold', '500': 'PlusJakartaSans_600SemiBold', '600': 'PlusJakartaSans_600SemiBold', '700': 'PlusJakartaSans_700Bold' },
};

/** Converts a token into a React Native text style (Android needs the weight in the family name). */
export function textStyle(t: TextStyleToken) {
  return {
    fontFamily: familyByWeight[t.fontFamily]?.[t.fontWeight] ?? t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontWeight: t.fontWeight,
    ...(t.fontVariant ? { fontVariant: t.fontVariant } : {}),
  };
}
