import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { SectionHeader } from './Layout';
import { Text } from './Text';

export type SectionWeight = 'primary' | 'secondary' | 'tertiary';

/**
 * UX-11/53 (UX audit §5.4): the building block for screen bodies. Stack sections in <Sections> (sectionGap).
 * - primary: the screen's main job, on a white surface card (at most one or two per screen)
 * - secondary: flat on the page ground, title + rows
 * - tertiary: a collapsed disclosure row ("Not coming today (2)")
 */
export function Section({
  title,
  meta,
  action,
  right,
  weight = 'secondary',
  count,
  defaultOpen = false,
  children,
  testID,
}: {
  title?: string;
  meta?: string;
  action?: { label: string; onPress: () => void };
  /** custom node at the right of the title (string = meta) */
  right?: ReactNode;
  weight?: SectionWeight;
  /** tertiary only: shown after the title */
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const [open, setOpen] = useState(defaultOpen);
  if (weight === 'tertiary') {
    return (
      <View testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((o) => !o)}
          testID={testID ? `${testID}-toggle` : undefined}
          style={{ minHeight: t.layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}
        >
          <Text variant="label" color="textSecondary" style={{ flex: 1 }}>
            {title}
            {count != null ? ` (${count})` : ''}
          </Text>
          <Icon icon={open ? ChevronUp : ChevronDown} color="textSecondary" />
        </Pressable>
        {open ? <View style={{ gap: t.spacing.stackGap }}>{children}</View> : null}
      </View>
    );
  }
  const header = !title ? null : right != null && typeof right !== 'string' ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm }}>
      <View style={{ flex: 1 }}>
        <SectionHeader title={title} />
      </View>
      {right}
    </View>
  ) : (
    <SectionHeader title={title} right={action?.label ?? meta ?? (right as string | undefined)} onRightPress={action?.onPress} />
  );
  const body = <View style={{ gap: t.spacing.stackGap }}>{children}</View>;
  if (weight === 'primary') {
    return (
      <View testID={testID} style={{ gap: t.spacing.sectionHeaderGap }}>
        {header}
        <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: t.layout.cardBorderWidth, borderRadius: t.radius.card, padding: t.spacing.md }}>{body}</View>
      </View>
    );
  }
  return (
    <View testID={testID} style={{ gap: t.spacing.sectionHeaderGap }}>
      {header}
      {body}
    </View>
  );
}

/** Small uppercase label for sub-groups inside a section ("TOMORROW", "GREEN PARK RESIDENCY"). */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="sectionLabel" color="textSecondary" accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Vertical stack of sections with the one section gap (UX-53). */
export function Sections({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={{ gap: t.spacing.sectionGap }}>{children}</View>;
}
