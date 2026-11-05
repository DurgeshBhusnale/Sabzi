import { Redirect } from 'expo-router';
import { homeFor, useSession } from '../src/features/auth/session';
import { Splash } from '../src/features/system/Splash';

/** Entry gate: splash while the session loads, then the right home for the account. */
export default function Index() {
  const { status, step } = useSession();
  if (status === 'loading') return <Splash />;
  return <Redirect href={homeFor(step) as never} />;
}
