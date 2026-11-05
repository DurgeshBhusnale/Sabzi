import { useState } from 'react';
import { View } from 'react-native';
import { istHour, LIMITS, type RequestGroup } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, EmptyState, ItemArt, SkeletonBlock, StatusPill, Text } from '../../ui';
import { en } from '../../i18n/en';

/** V-13: grouped by item with picture, total quantity, buyers, societies; notes; Will bring / Can't bring. */
export function VendorRequestsView({
  groups,
  loading,
  dateLabel,
  now = new Date(),
  onAnswer,
  onShareQr,
}: {
  groups: RequestGroup[] | undefined;
  loading: boolean;
  dateLabel: string;
  now?: Date;
  onAnswer: (key: string, status: 'will_bring' | 'cant_bring') => Promise<void>;
  onShareQr: () => void;
}) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (loading || !groups) return <SkeletonBlock kind="list" count={3} />;
  const before4 = istHour(now) < LIMITS.requestsVisibleFromHourIst;
  const total = groups.reduce((n, g) => n + g.count, 0);
  const allAnswered = groups.length > 0 && groups.every((g) => g.status === 'will_bring' || g.status === 'cant_bring');
  return (
    <View style={{ gap: t.spacing.md }} testID="vendor-requests">
      <View>
        <Text variant="h1">{en.eng.vrTitle}</Text>
        <Text color="textSecondary">{dateLabel}</Text>
      </View>
      {groups.length === 0 ? (
        <EmptyState illustration="list" title={en.eng.vrNone} body={en.eng.vrNoneBody} actionLabel={en.eng.vrShareQr} onAction={onShareQr} testID="vr-empty" />
      ) : (
        <>
          {before4 ? <Banner kind="info" message={en.eng.vrBefore4} testID="vr-before-4" /> : null}
          {allAnswered ? <Banner kind="success" message={en.eng.vrAllAnswered(total)} testID="vr-all-answered" /> : null}
          {groups.map((g) => (
            <Card key={g.key} style={{ gap: t.spacing.sm }} testID={`vr-group-${g.name}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <ItemArt name={g.name} size={48} />
                <View style={{ flex: 1 }}>
                  <Text weight="700">{g.totalLabel ? `${g.name} · ${g.totalLabel}` : g.name}</Text>
                  <Text variant="bodySmall" color="textSecondary">{`${en.eng.vrBuyers(g.count)} · ${g.societies.join(', ')}`}</Text>
                </View>
                {g.status === 'will_bring' ? <StatusPill status="will_bring" label={en.eng.willBring} /> : g.status === 'cant_bring' ? <StatusPill status="cant_bring" label={en.eng.cantBring} /> : null}
              </View>
              {g.notes.length ? (
                <Button label={open === g.key ? en.eng.hideNotes : en.eng.showNotes} variant="tertiary" fullWidth={false} onPress={() => setOpen(open === g.key ? null : g.key)} />
              ) : null}
              {open === g.key
                ? g.notes.map((n, i) => (
                    <Text key={i} variant="bodySmall" color="textSecondary">{`${n.buyer} · ${n.society}${n.qty ? ` · ${n.qty}` : ''}: "${n.note}"`}</Text>
                  ))
                : null}
              <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
                <View style={{ flex: 1 }}>
                  <Button size="xl" label={en.eng.willBring} variant={g.status === 'will_bring' ? 'primary' : 'secondary'} loading={busy === `${g.key}:w`} testID={`will-${g.name}`}
                    onPress={async () => { setBusy(`${g.key}:w`); try { await onAnswer(g.key, 'will_bring'); } finally { setBusy(null); } }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button size="xl" label={en.eng.cantBring} variant={g.status === 'cant_bring' ? 'destructive' : 'secondary'} loading={busy === `${g.key}:c`} testID={`cant-${g.name}`}
                    onPress={async () => { setBusy(`${g.key}:c`); try { await onAnswer(g.key, 'cant_bring'); } finally { setBusy(null); } }} />
                </View>
              </View>
            </Card>
          ))}
        </>
      )}
    </View>
  );
}
