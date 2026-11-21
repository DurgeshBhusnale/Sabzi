import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { homeFor, useSession } from '../src/features/auth/session';
import { Splash } from '../src/features/system/Splash';
import { X01NoInternet } from '../src/features/system/SystemStates';
import { takePendingRoute } from '../src/lib/pendingRoute';
import { useSplashHold } from '../src/lib/splashGate';

/** Entry gate: splash while the session loads, then a pending deep link (QR) or the right home. */
export default function Index() {
  const { status, step, onboardingSeen, refresh } = useSession();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const hold = useSplashHold();
  useEffect(() => {
    if (status !== 'signedIn') return;
    takePendingRoute().then(setPending);
  }, [status]);
  if (hold || status === 'loading' || (status === 'signedIn' && pending === undefined)) return <Splash />;
  // TECH-04: signed in but the account could not load (and nothing cached): offer a retry, never onboarding.
  if (status === 'error') return <X01NoInternet onRetry={refresh} />;
  if (pending && (step === 'buyer' || step === 'name' || step === 'role')) {
    if (step !== 'buyer') return <Redirect href={homeFor(step, onboardingSeen) as never} />;
    return <Redirect href={pending as never} />;
  }
  return <Redirect href={homeFor(step, onboardingSeen) as never} />;
}
