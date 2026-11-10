import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { Text } from './Text';

/** Settings row with a switch: on, off, disabled. Whole row is the touch target. */
export function Toggle({ label, description, value, onChange, disabled = false, testID }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, { minHeight: t.layout.minTouch + 8, gap: t.spacing.sm }]}
    >
      <View style={styles.flex}>
        <Text variant="label" color={disabled ? 'textMuted' : 'textPrimary'}>{label}</Text>
        {description ? <Text variant="caption" weight="400" color="textSecondary">{description}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        importantForAccessibility="no"
        trackColor={{ true: t.colors.primary, false: t.scheme === 'dark' ? t.colors.border : '#CFCDBF' }}
        thumbColor={t.colors.surface}
      />
    </Pressable>
  );
}

export function Checkbox({ label, value, onChange, disabled = false, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, { minHeight: t.layout.minTouch, gap: t.spacing.sm }]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: disabled ? t.colors.disabled : t.colors.primary,
          backgroundColor: value ? (disabled ? t.colors.disabled : t.colors.primary) : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? <Icon icon={Check} size={16} color="onPrimary" /> : null}
      </View>
      <Text style={styles.flex} color={disabled ? 'textMuted' : 'textPrimary'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
