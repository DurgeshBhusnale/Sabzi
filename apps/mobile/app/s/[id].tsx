import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, SkeletonBlock } from '../../src/ui';
import { useSession } from '../../src/features/auth/session';
import { saveSociety } from '../../src/features/buyer/api';
import { buyerKeys } from '../../src/features/buyer/hooks';
import { setPendingRoute } from '../../src/lib/pendingRoute';
import { societyIdSchema } from '@sabzi/shared';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { en } from '../../src/i18n/en';

/** Society poster QR: saves the society for a buyer and opens home; logged-out users log in first. */
export default function SocietyEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, step } = useSession();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  // SEC-14: a society link must carry a UUID; anything else is never saved or remembered.
  const valid = societyIdSchema.safeParse(id ?? '').success;
  useEffect(() => {
    if (!valid) return;
    if (status === 'signedOut') setPendingRoute(`/s/${id}`);
    if (status !== 'signedIn' || step !== 'buyer') return;
    saveSociety(id)
      .catch(() => undefined)
      .finally(() => qc.invalidateQueries({ queryKey: buyerKeys.mine }).then(() => setDone(true)));
  }, [status, step, id, qc, valid]);
  if (!valid) return <SystemScreen illustration="search" title={en.system.badLink} actionLabel={en.common.goHome} onAction={() => router.replace('/')} testID="society-bad-link" />;
  if (status === 'signedOut') return <Redirect href="/(auth)/signin" />;
  if (status === 'signedIn' && step !== 'buyer') return <Redirect href="/" />;
  if (done) return <Redirect href="/(buyer)/home" />;
  return <Screen><SkeletonBlock kind="vendorCard" /></Screen>;
}
