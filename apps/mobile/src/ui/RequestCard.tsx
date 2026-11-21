import { StyleSheet, View } from 'react-native';
import { ChevronRight, CircleCheck, CircleX, Clock, HandCoins, type LucideIcon as Lucide } from 'lucide-react-native';
import type { ColorTokens } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt } from './Art';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusPill, type PillStatus } from './StatusPill';
import { Text } from './Text';

/** How a request's status is presented: drives the colour of the status block and its icon. */
export type RequestTone = 'waiting' | 'action' | 'success' | 'error' | 'muted';

const TONE: Record<RequestTone, { bg: keyof ColorTokens; fg: keyof ColorTokens; icon: Lucide }> = {
  waiting: { bg: 'surface2', fg: 'textSecondary', icon: Clock },
  action: { bg: 'dealAmberTint', fg: 'dealAmberText', icon: HandCoins },
  success: { bg: 'primaryTint', fg: 'onPrimaryTint', icon: CircleCheck },
  error: { bg: 'errorTint', fg: 'onErrorTint', icon: CircleX },
  muted: { bg: 'surface2', fg: 'textMuted', icon: Clock },
};

/** Status block: tinted panel with icon, headline and one line of detail. Used on the card and the detail hero. */
export function RequestStatusBlock({ tone, headline, detail, large = false, testID }: { tone: RequestTone; headline: string; detail?: string | null; large?: boolean; testID?: string }) {
  const t = useTheme();
  const s = TONE[tone];
  return (
    <View
      testID={testID ?? `request-status-${tone}`}
      accessibilityRole="text"
      accessibilityLabel={detail ? `${headline}. ${detail}` : headline}
      style={[styles.row, { backgroundColor: t.colors[s.bg], borderRadius: t.radius.button, padding: large ? t.spacing.md : t.spacing.sm, gap: t.spacing.sm }]}
    >
      <Icon icon={s.icon} size={large ? 28 : 22} color={s.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant={large ? 'sectionTitle' : 'label'} weight="700" color={s.fg} testID="request-answer">{headline}</Text>
        {detail ? <Text variant="bodySmall" color={s.fg}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/**
 * B-12 request card (request flow v2). The whole card opens the request; the status is a tinted block, and when
 * the vendor has quoted a price the card carries the price and the Confirm order / Not now buttons itself.
 */
export function RequestCard({
  item,
  qty,
  vendorName,
  when,
  pill,
  tone,
  headline,
  detail,
  price,
  priceLabel,
  priceNote,
  actions,
  vendorNote,
  onPress,
  testID,
}: {
  item: string;
  qty?: string | null;
  vendorName: string;
  /** "Tomorrow morning · 8:00–8:45 AM" */
  when: string;
  pill: { status: PillStatus; label: string };
  tone: RequestTone;
  headline: string;
  detail?: string | null;
  /** "₹40 / kg" when the vendor quoted */
  price?: string | null;
  priceLabel?: string;
  priceNote?: string;
  actions?: React.ReactNode;
  /** "Note from Ramesh" + the vendor's note with his answer */
  vendorNote?: { label: string; text: string } | null;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const highlight = tone === 'action';
  return (
    <Card
      onPress={onPress}
      testID={testID ?? `request-${tone}`}
      accessibilityLabel={`${item}${qty ? `, ${qty}` : ''}. ${headline}. ${when}`}
      style={[{ gap: t.spacing.sm }, highlight ? { borderColor: t.colors.dealAmber, borderWidth: 2 } : null]}
    >
      <View style={[styles.row, { gap: t.spacing.sm }]}>
        <ItemArt name={item} size={44} />
        <View style={[styles.flex, { gap: 2 }]}>
          <Text variant="label" weight="700" numberOfLines={1}>{qty ? `${item} · ${qty}` : item}</Text>
          <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>{`${vendorName} · ${when}`}</Text>
        </View>
        <StatusPill status={pill.status} label={pill.label} />
        {onPress ? <Icon icon={ChevronRight} size={20} color="textMuted" /> : null}
      </View>
      <RequestStatusBlock tone={tone} headline={headline} detail={price ? null : detail} />
      {vendorNote ? (
        <View style={{ backgroundColor: t.colors.surface2, borderRadius: t.radius.button, padding: t.spacing.sm, gap: 2 }} testID="request-vendor-note">
          <Text variant="caption" color="textSecondary">{vendorNote.label}</Text>
          <Text variant="bodySmall">{`“${vendorNote.text}”`}</Text>
        </View>
      ) : null}
      {price ? (
        <View style={[styles.priceRow, { gap: t.spacing.xs }]} testID="request-price">
          <Text variant="bodySmall" color="textSecondary">{priceLabel}</Text>
          <Text variant="price" weight="600">{price}</Text>
        </View>
      ) : null}
      {price && priceNote ? <Text variant="caption" color="textSecondary">{priceNote}</Text> : null}
      {actions ? <View style={{ marginTop: t.spacing.xs }}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
