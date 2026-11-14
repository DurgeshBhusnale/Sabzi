import { View } from 'react-native';
import { formatPrice } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { ItemArt, ToggleRow } from '../../ui';
import type { DayMenu } from './api';
import { en } from '../../i18n/en';

/** Today's items; the whole 56 dp row toggles sold out and keeps full contrast (V-09 quick list, V-10, UX-37). */
export function SoldOutList({ menu, onToggle }: { menu: DayMenu; onToggle: (itemId: string, soldOut: boolean) => void }) {
  const t = useTheme();
  return (
    <View>
      {menu.lines.map((l, i) => (
        <View key={l.itemId} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <ItemArt name={l.name} size={36} />
          <View style={{ flex: 1 }}>
            <ToggleRow
              testID={`soldout-${l.name}`}
              label={l.name}
              sub={formatPrice(l.price, l.unit)}
              value={!!l.soldOut}
              onChange={(v) => onToggle(l.itemId, v)}
              onLabel={en.menu.soldOut}
              offLabel={en.vendor.tapIfFinished}
              last={i === menu.lines.length - 1}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
