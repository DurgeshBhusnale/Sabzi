import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheet, Icon, ListRow, Text } from '../../ui';
import { useTheme } from '../../theme/ThemeProvider';
import { useBuyer } from '../buyer/BuyerContext';
import { useBuyerHome } from '../buyer/hooks';
import type { HomeVendor } from '../buyer/types';
import { ratingText } from '../buyer/HomeView';
import { en } from '../../i18n/en';

export type PickableVendor = { id: string; name: string; sub: string; following: boolean };

/** Vendors serving the society, one row each, followed first then by name. Pure for tests. */
export function pickableVendors(rows: HomeVendor[] | undefined): PickableVendor[] {
  const seen = new Map<string, PickableVendor>();
  for (const v of rows ?? []) {
    if (seen.has(v.vendor_id)) continue;
    seen.set(v.vendor_id, { id: v.vendor_id, name: v.display_name, sub: [ratingText(v), v.gate_name].join(' · '), following: v.is_following });
  }
  return [...seen.values()].sort((a, b) => Number(b.following) - Number(a.following) || a.name.localeCompare(b.name));
}

/**
 * UX-07 / UX-23: "Request for tomorrow" from Home or the Requests tab picks a vendor first, then opens B-11.
 * The list is the current society's vendors (from the Home query, so it is usually already cached).
 */
export function VendorPickerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (v: PickableVendor) => void }) {
  const t = useTheme();
  const { societyId } = useBuyer();
  const home = useBuyerHome(societyId);
  const list = pickableVendors(home.data);
  return (
    <BottomSheet visible={visible} onClose={onClose} title={en.buyer.pickVendorTitle} testID="vendor-picker">
      <View style={{ gap: t.spacing.xs }}>
        <Text variant="bodySmall" color="textSecondary">{list.length ? en.buyer.pickVendorBody : en.buyer.pickVendorEmpty}</Text>
        <View>
          {list.map((v, i) => (
            <ListRow
              key={v.id}
              testID={`pick-${v.id}`}
              title={v.name}
              subtitle={v.following ? `${en.buyer.following} · ${v.sub}` : v.sub}
              last={i === list.length - 1}
              onPress={() => onPick(v)}
              right={<Icon icon={ChevronRight} size={16} color="textSecondary" />}
            />
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
