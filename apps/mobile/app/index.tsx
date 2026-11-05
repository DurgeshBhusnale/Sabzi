import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { homeFor, useSession } from '../src/features/auth/session';
import { Splash } from '../src/features/system/Splash';
import { takePendingRoute } from '../src/lib/pendingRoute';

/** Entry gate: splash while the session loads, then a pending deep link (QR) or the right home. */
export default function Index() {
  const { status, step } = useSession();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (status !== 'signedIn') return;
    takePendingRoute().then(setPending);
  }, [status]);
  if (status === 'loading' || (status === 'signedIn' && pending === undefined)) return <Splash />;
  if (pending && (step === 'buyer' || step === 'name' || step === 'role')) {
    if (step !== 'buyer') return <Redirect href={homeFor(step) as never} />;
    return <Redirect href={pending as never} />;
  }
  return <Redirect href={homeFor(step) as never} />;
}
