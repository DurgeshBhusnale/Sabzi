import { Text as RNText, type TextProps } from 'react-native';
import type { ColorTokens, TypeScale } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { textStyle } from '../theme/fonts';

export type TextVariant = keyof TypeScale;

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: keyof ColorTokens;
  weight?: '400' | '500' | '600' | '700';
  align?: 'left' | 'center' | 'right';
  strike?: boolean;
};

/** All text goes through this so it always uses the active type scale and colour tokens. */
export function Text({ variant = 'body', color = 'textPrimary', weight, align, strike, style, ...rest }: AppTextProps) {
  const t = useTheme();
  const token = t.type[variant];
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        textStyle(weight ? { ...token, fontWeight: weight } : token),
        { color: t.colors[color] },
        align ? { textAlign: align } : null,
        strike ? { textDecorationLine: 'line-through' } : null,
        style,
      ]}
    />
  );
}
