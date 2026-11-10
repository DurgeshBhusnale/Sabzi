import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { distanceMeters, formatDistance, PILOT_AREA_LABELS, type LatLng } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Card, EmptyState, SkeletonBlock, Text, TextInput } from '../../ui';
import type { Society } from './types';
import { en } from '../../i18n/en';

/** B-01 list: GPS "Near you" ordering when location is on, search by name always. */
export function SocietyPicker({
  societies,
  loading,
  position,
  locating,
  locationOff,
  onPick,
  onNotListed,
  busyId,
}: {
  societies: Society[];
  loading: boolean;
  position: LatLng | null;
  locating: boolean;
  locationOff: boolean;
  onPick: (s: Society) => void;
  onNotListed: (q: string) => void;
  busyId?: string | null;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const f = societies.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (!position) return f.map((s) => ({ s, d: null as number | null }));
    return f.map((s) => ({ s, d: distanceMeters(position, s) })).sort((a, b) => a.d! - b.d!);
  }, [societies, q, position]);

  return (
    <View style={{ gap: t.spacing.md }}>
      <TextInput kind="search" placeholder={en.buyer.searchSociety} value={q} onChangeText={setQ} testID="society-search" />
      {locationOff ? <Banner kind="offline" message={en.buyer.locationOffSearch} testID="loc-off" /> : null}
      {locating ? <Text color="textSecondary">{en.buyer.findingNearby}</Text> : null}
      {loading ? (
        <SkeletonBlock kind="list" count={4} />
      ) : list.length === 0 ? (
        <EmptyState illustration="search" art="noResults" title={en.buyer.noSearchResults(q)} actionLabel={en.buyer.notListed} onAction={() => onNotListed(q)} testID="no-society" />
      ) : (
        <>
          <Text variant="h2">{position ? en.buyer.nearYou : en.buyer.allSocieties}</Text>
          {list.map(({ s, d }) => (
            <Card key={s.id} onPress={() => onPick(s)} testID={`society-${s.name}`} accessibilityLabel={s.name}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="600">{s.name}</Text>
                  <Text variant="bodySmall" color="textSecondary">
                    {[PILOT_AREA_LABELS[s.area], d != null ? en.buyer.kmAway(formatDistance(d)) : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {busyId === s.id ? <Text color="primary">…</Text> : null}
              </View>
            </Card>
          ))}
        </>
      )}
      <Pressable accessibilityRole="button" onPress={() => onNotListed(q)} style={{ minHeight: t.layout.minTouch, justifyContent: 'center' }}>
        <Text weight="600" color="primary" align="center">{en.buyer.notListed}</Text>
      </Pressable>
    </View>
  );
}
