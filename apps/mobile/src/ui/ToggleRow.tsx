import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { StatusPill, type PillStatus } from './StatusPill';
import { Text } from './Text';

/**
 * UX-37 (UX audit §5.4): the whole row is the switch, 56 dp in vendor mode / 48 dp for buyers. The row keeps
 * full contrast when on; a pill shows the state ("Sold out").
 */
export function ToggleRow({
  label,
  sub,
  value,
  onChange,
  onLabel,
  offLabel,
  pill = 'sold_out',
  disabled = false,
  last = false,
  testID,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  /** pill text while on, e.g. "Sold out" */
  onLabel: string;
  /** hint while off, e.g. "Tap if finished" */
  offLabel?: string;
  pill?: PillStatus;
  disabled?: boolean;
  last?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  const minHeight = t.mode === 'vendor' ? t.layout.vendorPrimaryHeight : t.layout.minTouch;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{
        minHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.colors.divider,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="label">{label}</Text>
        {sub ? <Text variant="caption" color="textSecondary">{sub}</Text> : null}
      </View>
      {value ? <StatusPill status={pill} label={onLabel} /> : offLabel ? <Text variant="caption" color="textMuted">{offLabel}</Text> : null}
    </Pressable>
  );
}
