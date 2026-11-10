import { View } from 'react-native';
import { formatPrice } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { ItemArt, Toggle } from '../../ui';
import type { DayMenu } from './api';
import { en } from '../../i18n/en';

/** Today's items with big sold-out toggles (V-09 quick list, V-10). */
export function SoldOutList({ menu, onToggle }: { menu: DayMenu; onToggle: (itemId: string, soldOut: boolean) => void }) {
  const t = useTheme();
  return (
    <View>
      {menu.lines.map((l) => (
        <View key={l.itemId} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.layout.listRowWithImage, borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
          <ItemArt name={l.name} size={36} muted={l.soldOut} />
          <View style={{ flex: 1 }}>
            <Toggle
              testID={`soldout-${l.name}`}
              label={l.name}
              description={l.soldOut ? en.menu.soldOut : formatPrice(l.price, l.unit)}
              value={!!l.soldOut}
              onChange={(v) => onToggle(l.itemId, v)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
