import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PermissionRationale } from '../../src/features/system/PermissionRationale';
import { requestLocationPermission } from '../../src/lib/permissions';
import { en } from '../../src/i18n/en';

/** S-09; then into the role's onboarding (buyer B-01, vendor V-01). */
export default function LocationRationale() {
  const { role = 'buyer' } = useLocalSearchParams<{ role: string }>();
  const [busy, setBusy] = useState(false);
  const next = () => router.replace('/');
  return (
    <PermissionRationale
      kind="location"
      title={role === 'vendor' ? en.permissions.locTitleVendor : en.permissions.locTitleBuyer}
      body={en.permissions.locBody}
      busy={busy}
      onAllow={async () => {
        setBusy(true);
        await requestLocationPermission().catch(() => 'denied');
        setBusy(false);
        next();
      }}
      onSkip={next}
    />
  );
}
