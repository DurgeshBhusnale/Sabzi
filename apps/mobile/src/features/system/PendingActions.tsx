import { useState } from 'react';
import { View } from 'react-native';
import { formatIstTime } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, BottomSheet, Button, Card, StatusPill, Text } from '../../ui';
import { useOffline } from '../../lib/offline/OfflineProvider';
import type { QueuedAction } from '../../lib/offline/queue';
import { en } from '../../i18n/en';

const PILL = { queued: 'waiting', sending: 'leaving_soon', sent: 'will_bring', failed: 'cant_bring', needs_confirm: 'leaving_soon' } as const;

export function PendingList({ actions, onRetry, onConfirm }: { actions: QueuedAction[]; onRetry: (id: string) => void; onConfirm: (id: string, send: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      {actions.map((a) => (
        <Card key={a.clientId} testID={`pending-${a.status}`} style={{ gap: t.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text weight="600">{en.system.actionLabels[a.kind]}</Text>
              <Text variant="caption" color="textSecondary">{formatIstTime(new Date(a.createdAt))}</Text>
            </View>
            <StatusPill status={PILL[a.status]} label={en.system.status[a.status]} />
          </View>
          {a.status === 'failed' ? <Button label={en.common.retry} variant="tertiary" fullWidth={false} onPress={() => onRetry(a.clientId)} /> : null}
          {a.status === 'needs_confirm' ? (
            <>
              <Text variant="bodySmall">{en.system.staleQ(formatIstTime(new Date(a.createdAt)))}</Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
                <View style={{ flex: 1 }}><Button label={en.system.sendAnyway} onPress={() => onConfirm(a.clientId, true)} testID="stale-send" /></View>
                <View style={{ flex: 1 }}><Button label={en.system.dontSend} variant="secondary" onPress={() => onConfirm(a.clientId, false)} /></View>
              </View>
            </>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

/** X-04: persistent chip on Today with the list of queued vendor actions. */
export function PendingActionsChip() {
  const { pending, actions, retry, confirmStale } = useOffline();
  const [open, setOpen] = useState(false);
  if (pending.length === 0) return null;
  return (
    <>
      <Banner kind="pending" testID="x04" message={en.system.pendingChip(pending.length)} actionLabel={en.common.seeAll} onAction={() => setOpen(true)} />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={en.system.pendingTitle}>
        <PendingList actions={[...pending, ...actions.filter((a) => a.status === 'sent').slice(-3)]} onRetry={retry} onConfirm={confirmStale} />
      </BottomSheet>
    </>
  );
}
