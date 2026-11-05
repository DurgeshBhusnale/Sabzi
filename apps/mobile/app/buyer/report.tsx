import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { REPORT_REASONS, REPORT_REASON_LABELS, type ReportReason } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Chip, EmptyState, PhotoUploader, Screen, Text, TextInput, TopAppBar, type PhotoUploaderState } from '../../src/ui';
import { reportVendor } from '../../src/features/engagement/api';
import { captureCompressed } from '../../src/features/vendor/photos';
import { uploadImage } from '../../src/lib/storage';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** B-14: reason chips, text, optional photo; submitting, submitted. */
export default function ReportVendor() {
  const t = useTheme();
  const { vendorId, name = '' } = useLocalSearchParams<{ vendorId: string; name: string }>();
  const { account } = useSession();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<{ state: PhotoUploaderState; path: string | null; uri: string | null }>({ state: 'empty', path: null, uri: null });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <Screen header={<TopAppBar onBack={() => router.back()} />}>
        <EmptyState illustration="handshake" title={en.eng.reportSentTitle} body={en.eng.reportSentBody} actionLabel={en.common.done} onAction={() => router.back()} testID="report-sent" />
      </Screen>
    );
  }
  return (
    <Screen
      header={<TopAppBar title={en.eng.reportTitle} onBack={() => router.back()} />}
      footer={
        <Button
          label={en.eng.reportSubmit}
          disabled={!reason || photo.state === 'uploading'}
          loading={busy}
          testID="send-report"
          onPress={async () => {
            setBusy(true);
            try {
              await reportVendor(vendorId, reason!, text.trim() || null, photo.path);
              setDone(true);
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <Text variant="h2">{name}</Text>
      <Text weight="600">{en.eng.reportWhy}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
        {REPORT_REASONS.map((r) => <Chip key={r} kind="tag" label={REPORT_REASON_LABELS[r]} selected={reason === r} onPress={() => setReason(r)} />)}
      </View>
      <TextInput kind="multiline" label={en.eng.reportText} maxChars={500} value={text} onChangeText={setText} />
      <Text weight="600">{en.eng.addPhoto}</Text>
      <View style={{ width: 120 }}>
        <PhotoUploader
          state={photo.state}
          uri={photo.uri}
          onRetry={() => setPhoto({ state: 'empty', path: null, uri: null })}
          onPress={async () => {
            setPhoto((p) => ({ ...p, state: 'capturing' }));
            const r = await captureCompressed(1024 * 1024);
            if (r.kind !== 'ok') return setPhoto((p) => ({ ...p, state: 'empty' }));
            setPhoto({ state: 'uploading', path: null, uri: r.uri });
            try {
              const path = `${account!.user_id}/report-${Date.now()}.jpg`;
              await uploadImage('report-photos', path, r.uri);
              setPhoto({ state: 'uploaded', path, uri: r.uri });
            } catch {
              setPhoto({ state: 'failed', path: null, uri: r.uri });
            }
          }}
        />
      </View>
    </Screen>
  );
}
