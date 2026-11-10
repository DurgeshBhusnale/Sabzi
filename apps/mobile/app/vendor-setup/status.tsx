import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, Card, EmptyState, Icon, PhotoUploader, Screen, SkeletonBlock, Text, type PhotoUploaderState } from '../../src/ui';
import { useInvalidateVendor, useMyVendor, vendorKeys } from '../../src/features/vendor/hooks';
import { markVerifiedSeen, saveVendorProfile } from '../../src/features/vendor/api';
import { captureCompressed } from '../../src/features/vendor/photos';
import { uploadImage } from '../../src/lib/storage';
import { en } from '../../src/i18n/en';

const callSupport = () => Linking.openURL(`tel:${SUPPORT_PHONE}`);

/** V-03: pending, needs more info (upload), rejected (reason + contact), verified (first time only). */
export default function VerificationStatus() {
  const t = useTheme();
  const vendor = useMyVendor();
  const invalidate = useInvalidateVendor();
  const [docState, setDocState] = useState<PhotoUploaderState>('empty');
  const [docPath, setDocPath] = useState<string | null>(null);
  const v = vendor.data;
  if (!v) return <Screen><SkeletonBlock kind="list" count={3} /></Screen>;

  if (v.status === 'verified') {
    return (
      <Screen
        scroll={false}
        footer={
          <View style={{ gap: t.spacing.xs }}>
            <Button size="xl" label={en.vendor.goToToday} testID="go-today" onPress={async () => { await markVerifiedSeen(); await invalidate(vendorKeys.me); router.replace('/(vendor)/today'); }} />
            <Button label={en.vendor.shareMyQr} variant="secondary" onPress={async () => { await markVerifiedSeen(); router.replace('/vendor/qr'); }} />
          </View>
        }
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState art="success" title={en.vendor.verifiedTitle} body={en.vendor.verifiedBody} testID="v03-verified" />
        </View>
      </Screen>
    );
  }

  if (v.status === 'rejected') {
    return (
      <Screen scroll={false} footer={<Button size="xl" label={en.common.callSupport} onPress={callSupport} />}>
        <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.md }}>
          <EmptyState illustration="store" title={en.vendor.rejectedTitle} testID="v03-rejected" />
          <Card>
            <Text variant="caption" color="textSecondary">{en.vendor.reasonFromTeam}</Text>
            <Text>{v.status_reason}</Text>
          </Card>
          <Text color="textSecondary">{en.vendor.rejectedHelp}</Text>
        </View>
      </Screen>
    );
  }

  if (v.status === 'needs_info') {
    return (
      <Screen
        footer={
          <View style={{ gap: t.spacing.xs }}>
            <Button
              size="xl"
              label={en.vendor.sendForVerification}
              disabled={!docPath}
              onPress={async () => {
                await saveVendorProfile({ display_name: v.display_name, vehicle: v.vehicle, vehicle_no: v.vehicle_no, pmc_vendor_id: v.pmc_vendor_id, delivery_available: v.delivery_available, allow_calls: v.allow_calls, pmc_doc_path: docPath });
                await invalidate(vendorKeys.me);
                router.replace('/(vendor)/today');
              }}
            />
            <Button label={en.common.callSupport} variant="secondary" onPress={callSupport} />
          </View>
        }
      >
        <EmptyState illustration="list" title={en.vendor.needsInfoTitle} body={v.status_reason ?? undefined} testID="v03-needs-info" />
        <PhotoUploader
          state={docState}
          onPress={async () => {
            setDocState('capturing');
            const r = await captureCompressed(2 * 1024 * 1024);
            if (r.kind !== 'ok') return setDocState('empty');
            setDocState('uploading');
            try {
              const path = `${v.user_id}/pmc-${Date.now()}.jpg`;
              await uploadImage('pmc-docs', path, r.uri);
              setDocPath(path);
              setDocState('uploaded');
            } catch {
              setDocState('failed');
            }
          }}
          onRetry={() => setDocState('empty')}
        />
        <Text variant="caption" align="center" color="textSecondary">{en.vendor.takePmcPhoto}</Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Button size="xl" label={en.vendor.setUpMenu} onPress={() => router.replace('/vendor/menu')} testID="setup-menu" />
          <Button label={en.common.callSupport} variant="secondary" onPress={callSupport} />
        </View>
      }
    >
      <EmptyState illustration="handshake" title={en.vendor.pendingTitle} testID="v03-pending" />
      <Card style={{ gap: t.spacing.xs }}>
        <Text weight="600">{en.vendor.detailsSent}</Text>
        {en.vendor.pendingSteps.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' }}>
            <Icon icon={i === 0 ? CheckCircle2 : Circle} color={i === 0 ? 'primary' : 'textMuted'} size={20} />
            <Text color={i === 0 ? 'textPrimary' : 'textSecondary'}>{s}</Text>
          </View>
        ))}
      </Card>
      <Banner kind="info" message={en.vendor.pendingNote} />
    </Screen>
  );
}
