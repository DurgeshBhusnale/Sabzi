import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt } from './Art';
import { Card } from './Card';
import { StatusPill } from './StatusPill';
import { Text } from './Text';
import { en } from '../i18n/en';

export type RequestStatus = 'open' | 'will_bring' | 'cant_bring' | 'cancelled';

export function RequestCard({
  item,
  qty,
  note,
  vendorName,
  society,
  status,
  action,
}: {
  item: string;
  qty?: string | null;
  note?: string | null;
  vendorName?: string;
  society?: string;
  status: RequestStatus;
  action?: React.ReactNode;
}) {
  const t = useTheme();
  const pill = status === 'will_bring' ? 'will_bring' : status === 'cant_bring' ? 'cant_bring' : 'waiting';
  const sub = [vendorName, note ? `"${note}"` : society].filter(Boolean).join(' · ');
  return (
    <Card testID={`request-${status}`}>
      <View style={[styles.row, { gap: t.spacing.sm }]}>
        <ItemArt name={item} size={40} />
        <View style={[styles.flex, { gap: 2 }]}>
          <Text variant="label">{qty ? `${item} · ${qty}` : item}</Text>
          {sub ? <Text variant="bodySmall" color="textSecondary">{sub}</Text> : null}
        </View>
        <StatusPill status={status === 'cancelled' ? 'left' : pill} label={en.requests.status[status]} />
      </View>
      {action ? <View style={{ marginTop: t.spacing.sm }}>{action}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
