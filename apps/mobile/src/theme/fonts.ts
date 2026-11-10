import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
} from '@expo-google-fonts/newsreader';
import type { TextStyleToken } from '@sabzi/shared';

/** Font files registered in the root layout (v4: Newsreader headings, Figtree body). */
export const fontAssets = {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
};

const familyByWeight: Record<string, Record<string, string>> = {
  Figtree: { '400': 'Figtree_400Regular', '500': 'Figtree_500Medium', '600': 'Figtree_600SemiBold', '700': 'Figtree_700Bold' },
  Newsreader: { '400': 'Newsreader_400Regular', '500': 'Newsreader_500Medium', '600': 'Newsreader_500Medium', '700': 'Newsreader_500Medium' },
};

/** Converts a token into a React Native text style (Android needs the weight and style in the family name). */
export function textStyle(t: TextStyleToken) {
  const italic = t.fontStyle === 'italic';
  const family =
    italic && t.fontFamily === 'Newsreader'
      ? 'Newsreader_400Regular_Italic'
      : (familyByWeight[t.fontFamily]?.[t.fontWeight] ?? t.fontFamily);
  return {
    fontFamily: family,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    // Android picks the face from the family name; a fontWeight on top can fake-bold it, so keep 'normal'.
    fontWeight: 'normal' as const,
    ...(italic ? { fontStyle: 'italic' as const } : {}),
    ...(t.letterSpacing != null ? { letterSpacing: t.letterSpacing } : {}),
    ...(t.textTransform ? { textTransform: t.textTransform } : {}),
    ...(t.fontVariant ? { fontVariant: t.fontVariant } : {}),
  };
}
