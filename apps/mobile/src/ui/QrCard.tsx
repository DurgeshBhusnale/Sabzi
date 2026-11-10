import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PUBLIC_BASE_URL, qrColors } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { en } from '../i18n/en';

export function vendorQrUrl(code: string): string {
  return `${PUBLIC_BASE_URL}/v/${code}`;
}

/** Vendor QR with name and "Scan to follow me" (V-15, VEN-12). */
export function QrCard({ name, code, onShare, size = 'default' }: { name: string; code: string; onShare?: () => void; size?: 'default' | 'large' }) {
  const t = useTheme();
  const qr = size === 'large' ? 240 : 112;
  return (
    <Card testID="qr-card" style={size === 'large' ? { alignItems: 'center', gap: t.spacing.md } : [styles.row, { gap: t.spacing.md }]}>
      <View
        accessible
        accessibilityLabel={en.qr.a11y(name)}
        style={{ backgroundColor: qrColors.bg, padding: t.spacing.xs, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border }}
      >
        <QRCode value={vendorQrUrl(code)} size={qr} color={qrColors.fg} backgroundColor={qrColors.bg} />
      </View>
      <View style={[size === 'large' ? { alignItems: 'center' } : styles.flex, { gap: t.spacing.xxs }]}>
        <Text variant="h1" style={size === 'large' ? null : { fontSize: 22, lineHeight: 26 }}>{name}</Text>
        <Text color="textSecondary">{en.qr.scanToFollow}</Text>
        <Text variant="caption" color="textMuted">{en.qr.code(code)}</Text>
        {onShare ? <Button label={en.qr.share} variant="secondary" onPress={onShare} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
