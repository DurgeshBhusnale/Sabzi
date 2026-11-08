import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Screen, SkeletonBlock, TopAppBar } from '../../src/ui';
import { useSession } from '../../src/features/auth/session';
import { vendorByCode } from '../../src/features/buyer/api';
import { SystemScreen } from '../../src/features/system/SystemScreen';
import { track } from '../../src/lib/analytics';
import { setPendingRoute } from '../../src/lib/pendingRoute';
import { en } from '../../src/i18n/en';

/**
 * B-16: opened from a QR scan (https://<domain>/v/<code> or pheri://v/<code>).
 * Not logged in → S-03, remembering the code; logged in → vendor page with Follow.
 */
export default function QrEntry() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { status, step } = useSession();
  const vendor = useQuery({ queryKey: ['qr', code], queryFn: () => vendorByCode(code), enabled: status === 'signedIn' });
  useEffect(() => {
    track('qr_scanned', { source: 'app' });
  }, []);
  useEffect(() => {
    if (status === 'signedOut') setPendingRoute(`/v/${code}`);
  }, [status, code]);
  if (status === 'loading') return <Screen><SkeletonBlock kind="vendorCard" /></Screen>;
  if (status === 'signedOut') return <Redirect href="/(auth)/signin" />;
  if (step !== 'buyer') return <Redirect href="/" />;
  if (vendor.isLoading) return <Screen header={<TopAppBar title={en.buyer.qrTitle} />}><SkeletonBlock kind="vendorCard" /></Screen>;
  if (!vendor.data) {
    return <SystemScreen illustration="search" title={en.system.notFound} actionLabel={en.common.goHome} onAction={() => router.replace('/')} testID="qr-not-found" />;
  }
  return <Redirect href={{ pathname: '/buyer/vendor/[id]', params: { id: vendor.data } }} />;
}

export function QrFollowButton({ name, onPress }: { name: string; onPress: () => void }) {
  return <Button label={en.buyer.followName(name)} onPress={onPress} />;
}
