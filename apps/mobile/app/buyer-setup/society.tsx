import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Text, TopAppBar } from '../../src/ui';
import { SocietyPicker } from '../../src/features/buyer/SocietyPicker';
import { buyerKeys, useSocieties } from '../../src/features/buyer/hooks';
import { saveSociety, societyServed } from '../../src/features/buyer/api';
import { currentPosition, locationPermission } from '../../src/lib/permissions';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** B-01 */
export default function PickSociety() {
  const societies = useSocieties();
  const qc = useQueryClient();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [locOff, setLocOff] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ok = (await locationPermission()) === 'granted';
      if (!ok) {
        setLocOff(true);
        setLocating(false);
        return;
      }
      const p = await currentPosition();
      setPos(p);
      setLocOff(!p);
      setLocating(false);
    })();
  }, []);

  return (
    <Screen
      header={<TopAppBar title={en.buyer.pickTitle} onBack={router.canGoBack() ? () => router.back() : undefined} />}
      refreshing={societies.isRefetching}
      onRefresh={() => void societies.refetch()}
    >
      <Text color="textSecondary">{en.buyer.pickBody}</Text>
      {error ? <Text color="error">{error}</Text> : null}
      <SocietyPicker
        societies={societies.data ?? []}
        loading={societies.isLoading}
        position={pos}
        locating={locating}
        locationOff={locOff}
        busyId={busy}
        onNotListed={(q) => router.push({ pathname: '/buyer-setup/not-served', params: { name: q } })}
        onPick={async (s) => {
          setBusy(s.id);
          setError(null);
          try {
            await saveSociety(s.id);
            track('society_selected');
            await qc.invalidateQueries({ queryKey: buyerKeys.mine });
            if (await societyServed(s.id)) router.replace('/(buyer)/home');
            else router.replace({ pathname: '/buyer-setup/not-served', params: { name: s.name, id: s.id } });
          } catch (e) {
            setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
          } finally {
            setBusy(null);
          }
        }}
      />
    </Screen>
  );
}
