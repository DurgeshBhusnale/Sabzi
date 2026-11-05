import { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, View, type TextInputProps as RNProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { textStyle } from '../theme/fonts';
import { Text } from './Text';
import { Icon } from './Icon';

export type TextInputKind = 'text' | 'phone' | 'price' | 'search' | 'multiline' | 'email';

export type TextInputProps = Omit<RNProps, 'style'> & {
  label?: string;
  kind?: TextInputKind;
  error?: string | null;
  helper?: string;
  disabled?: boolean;
  /** Suffix like "/ kg" for price inputs */
  suffix?: string;
  maxChars?: number;
  testID?: string;
};

export function TextInput({
  label,
  kind = 'text',
  error,
  helper,
  disabled,
  suffix,
  maxChars,
  value,
  testID,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps) {
  const t = useTheme();
  const c = t.colors;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.border;
  const multiline = kind === 'multiline';
  const prefix = kind === 'phone' ? '+91' : kind === 'price' ? '₹' : null;

  return (
    <View style={{ gap: t.spacing.xxs }}>
      {label ? (
        <Text variant="bodySmall" weight="500" color={disabled ? 'textMuted' : 'textPrimary'}>
          {label}
        </Text>
      ) : null}
      <View
        testID={testID ? `${testID}-box` : undefined}
        style={[
          styles.box,
          {
            minHeight: multiline ? 120 : t.heights.input,
            borderRadius: t.radius.input,
            borderColor,
            borderWidth: focused || error ? 2 : 1,
            backgroundColor: disabled || kind === 'search' ? c.surface2 : c.surface,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {kind === 'search' ? (
          <View style={{ paddingLeft: t.spacing.sm }}>
            <Icon icon={Search} color="textMuted" size={20} />
          </View>
        ) : null}
        {prefix ? (
          <View style={[styles.prefix, { borderRightColor: c.border, paddingHorizontal: t.spacing.sm }]}>
            <Text color="textSecondary">{prefix}</Text>
          </View>
        ) : null}
        <RNTextInput
          testID={testID}
          accessibilityLabel={label}
          editable={!disabled}
          value={value}
          multiline={multiline}
          maxLength={kind === 'phone' ? 10 : maxChars}
          keyboardType={kind === 'phone' ? 'phone-pad' : kind === 'price' ? 'number-pad' : kind === 'email' ? 'email-address' : 'default'}
          autoCapitalize={kind === 'email' ? 'none' : rest.autoCapitalize}
          placeholderTextColor={c.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            textStyle(t.type.body),
            styles.input,
            {
              color: disabled ? c.textMuted : c.textPrimary,
              paddingHorizontal: t.spacing.sm,
              paddingVertical: multiline ? t.spacing.sm : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          {...rest}
        />
        {suffix ? (
          <Text color="textSecondary" style={{ paddingRight: t.spacing.sm }}>
            {suffix}
          </Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        {error ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite" style={styles.flex}>
            {error}
          </Text>
        ) : helper ? (
          <Text variant="caption" color="textMuted" style={styles.flex}>
            {helper}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {maxChars && multiline ? (
          <Text variant="caption" color="textMuted">{`${(value ?? '').length} / ${maxChars}`}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', overflow: 'hidden' },
  prefix: { alignSelf: 'stretch', justifyContent: 'center', borderRightWidth: 1 },
  input: { flex: 1, alignSelf: 'stretch' },
  footer: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
});
