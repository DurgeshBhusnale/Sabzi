import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, SkeletonBlock } from '../../src/ui';
import { useSession } from '../../src/features/auth/session';
import { saveSociety } from '../../src/features/buyer/api';
import { buyerKeys } from '../../src/features/buyer/hooks';
import { setPendingRoute } from '../../src/lib/pendingRoute';

/** Society poster QR: saves the society for a buyer and opens home; logged-out users log in first. */
export default function SocietyEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, step } = useSession();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (status === 'signedOut') setPendingRoute(`/s/${id}`);
    if (status !== 'signedIn' || step !== 'buyer') return;
    saveSociety(id)
      .catch(() => undefined)
      .finally(() => qc.invalidateQueries({ queryKey: buyerKeys.mine }).then(() => setDone(true)));
  }, [status, step, id, qc]);
  if (status === 'signedOut') return <Redirect href="/(auth)/signin" />;
  if (status === 'signedIn' && step !== 'buyer') return <Redirect href="/" />;
  if (done) return <Redirect href="/(buyer)/home" />;
  return <Screen><SkeletonBlock kind="vendorCard" /></Screen>;
}
