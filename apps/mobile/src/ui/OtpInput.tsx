import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { textStyle } from '../theme/fonts';
import { Text } from './Text';

export type OtpState = 'default' | 'error' | 'success';

/**
 * 6 boxes over one hidden input: typing auto-advances and pasting fills all six.
 * Android SMS auto-fill works through textContentType/autoComplete "sms-otp".
 */
export function OtpInput({
  value,
  onChange,
  state = 'default',
  message,
  length = 6,
  autoFocus,
  testID = 'otp',
}: {
  value: string;
  onChange: (v: string) => void;
  state?: OtpState;
  message?: string | null;
  length?: number;
  autoFocus?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const ref = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const digits = value.split('');
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Enter the 6-digit code" style={[styles.row, { gap: t.spacing.xs }]}>
        {Array.from({ length }).map((_, i) => {
          const filled = digits[i] !== undefined;
          const active = i === digits.length && state === 'default';
          const border = state === 'error' ? c.error : state === 'success' ? c.primary : active ? c.primary : filled ? c.border : c.surface2;
          return (
            <View
              key={i}
              testID={`${testID}-box-${i}`}
              style={[
                styles.box,
                {
                  borderRadius: t.radius.input,
                  borderColor: border,
                  borderWidth: active || state !== 'default' ? 2 : 1,
                  backgroundColor: state === 'error' ? c.errorTint : filled || active ? c.surface : c.surface2,
                  minHeight: t.layout.minTouch + 6,
                },
              ]}
            >
              <Text variant="h1" color={state === 'error' ? 'error' : state === 'success' ? 'primary' : 'textPrimary'}>
                {digits[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <RNTextInput
        ref={ref}
        testID={testID}
        value={value}
        autoFocus={autoFocus}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={[styles.hidden, textStyle(t.type.body)]}
        caretHidden
      />
      {message ? (
        <Text variant="bodySmall" color={state === 'error' ? 'error' : state === 'success' ? 'primary' : 'textMuted'} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  box: { flex: 1, aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
