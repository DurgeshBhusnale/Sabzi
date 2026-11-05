import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { formatDistance, formatIstTime } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { ActivityIndicatorBlock } from './ActivityIndicatorBlock';
import { Banner, BottomSheet, Button, Icon, Text } from '../../ui';
import { cooldownUntil, suggestStop, type ArrivalSuggestion, type TodayStop } from './arrival';
import { en } from '../../i18n/en';
import { AppErrorException } from '../../lib/errors';
import { track } from '../../lib/analytics';

type Phase = 'finding' | 'choose' | 'sending' | 'sent' | 'queued' | 'error';

export type ArriveDeps = {
  getPosition: () => Promise<{ lat: number; lng: number } | null>;
  locationAllowed: () => Promise<boolean>;
  send: (stop: TodayStop, pos: { lat: number; lng: number } | null) => Promise<{ event_id: string; followers: number } | { queued: true }>;
  undo: (eventId: string) => Promise<void>;
  onDone: () => void;
  openSettings: () => void;
  isOnline?: () => boolean;
};

/** V-08 "I've arrived" bottom sheet with every listed state. */
export function ArriveSheet({ visible, stops, onClose, deps, now = () => new Date() }: { visible: boolean; stops: TodayStop[]; onClose: () => void; deps: ArriveDeps; now?: () => Date }) {
  const t = useTheme();
  const [phase, setPhase] = useState<Phase>('finding');
  const [suggestion, setSuggestion] = useState<ArrivalSuggestion | null>(null);
  const [selected, setSelected] = useState<TodayStop | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sent, setSent] = useState<{ event_id: string; followers: number } | null>(null);
  const [undoLeft, setUndoLeft] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setPhase('finding');
      setSent(null);
      setError(null);
      const allowed = await deps.locationAllowed();
      const p = allowed ? await deps.getPosition() : null;
      if (cancelled) return;
      setPos(p);
      const s = allowed ? suggestStop(p, stops) : suggestStop(null, stops);
      setSuggestion(s);
      setSelected(s.kind === 'suggested' ? s.stop : null);
      setPhase('choose');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (phase !== 'sent') return;
    if (undoLeft <= 0) {
      deps.onDone();
      return;
    }
    const id = setTimeout(() => setUndoLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, undoLeft]);

  const lockUntil = selected ? cooldownUntil(selected, now()) : null;
  const offline = deps.isOnline ? !deps.isOnline() : false;

  const send = async () => {
    if (!selected) return;
    setPhase('sending');
    try {
      const r = await deps.send(selected, pos);
      if ('queued' in r) {
        track('vendor_arrived', { queued: true });
        setPhase('queued');
        return;
      }
      track('vendor_arrived', { followers: r.followers });
      setSent(r);
      setUndoLeft(5);
      setPhase('sent');
    } catch (e) {
      setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
      setPhase('choose');
    }
  };

  const others = stops.filter((s) => !s.skipped && s.stopId !== selected?.stopId);
  const title = phase === 'sent' ? undefined : suggestion?.kind === 'suggested' ? en.vendor.whereAreYou : phase === 'finding' ? undefined : en.vendor.chooseStop;

  const stopOption = (s: TodayStop, highlight: boolean, distance?: number) => (
    <Pressable
      key={s.stopId}
      testID={`arrive-stop-${s.stopId}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: highlight }}
      onPress={() => setSelected(s)}
      style={{ padding: t.spacing.md, borderRadius: t.radius.card, borderWidth: highlight ? 2 : 1, borderColor: highlight ? t.colors.primary : t.colors.border, backgroundColor: highlight ? t.colors.primaryTint : t.colors.surface, minHeight: t.heights.vendorXL }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text weight="700">{`${s.societyName} · ${s.gateName}`}</Text>
        {!highlight ? <Text weight="600">{String(s.followers)}</Text> : null}
      </View>
      {highlight && distance != null ? <Text color="textSecondary">{en.vendor.away(formatDistance(distance))}</Text> : null}
      {highlight ? <Text weight="600" color="primary">{en.vendor.willBeTold(s.followers)}</Text> : null}
    </Pressable>
  );

  return (
    <BottomSheet visible={visible} onClose={phase === 'sending' ? () => undefined : onClose} title={title} testID="arrive-sheet"
      footer={
        phase === 'sent' ? (
          <Button
            label={en.vendor.undoIn(undoLeft)}
            variant="secondary"
            size="xl"
            testID="undo-arrival"
            onPress={async () => {
              if (sent) await deps.undo(sent.event_id).catch(() => undefined);
              setPhase('choose');
              setSent(null);
              onClose();
            }}
          />
        ) : phase === 'queued' ? (
          <Button size="xl" label={en.common.done} onPress={onClose} testID="queued-done" />
        ) : phase === 'choose' ? (
          <Button
            size="xl"
            label={offline ? en.vendor.sendWhenOnline : en.vendor.sendArrival}
            disabled={!selected || !!lockUntil}
            onPress={send}
            testID="send-arrival"
          />
        ) : null
      }
    >
      {phase === 'finding' ? <ActivityIndicatorBlock label={en.vendor.finding} /> : null}
      {phase === 'sending' ? <ActivityIndicatorBlock label={en.vendor.sending(selected?.followers ?? 0)} /> : null}
      {phase === 'sent' && sent ? (
        <View style={{ alignItems: 'center', gap: t.spacing.xs, paddingVertical: t.spacing.lg }} testID="arrival-sent">
          <Icon icon={CheckCircle2} size={80} color="brandLeaf" />
          <Text variant="h1">{en.vendor.sentTo(sent.followers)}</Text>
          <Text color="textSecondary">{selected ? `${selected.societyName} · ${selected.gateName}` : ''}</Text>
        </View>
      ) : null}
      {phase === 'queued' ? <Banner kind="pending" message={en.system.queuedArrival} testID="arrival-queued" /> : null}
      {phase === 'choose' ? (
        <>
          {suggestion?.kind === 'none_nearby' ? <Banner kind="pending" message={en.vendor.notNear} testID="none-nearby" /> : null}
          {suggestion?.kind === 'gps_off' ? <Banner kind="offline" message={en.vendor.locationOff} actionLabel={en.vendor.turnOn} onAction={deps.openSettings} testID="gps-off" /> : null}
          {suggestion?.kind === 'no_stops' ? <Banner kind="info" message={en.vendor.noStopsSheet} /> : null}
          {offline ? <Banner kind="pending" message={en.vendor.offlineArrival} testID="arrival-offline" /> : null}
          {selected ? stopOption(selected, true, suggestion?.kind === 'suggested' && suggestion.stop.stopId === selected.stopId ? suggestion.distance : undefined) : null}
          {lockUntil && selected ? (
            <Banner
              kind="info"
              testID="arrival-locked"
              message={en.vendor.alreadyAlerted(selected.followers, formatIstTime(selected.lastArrivalAt!), formatIstTime(lockUntil))}
            />
          ) : null}
          {others.length ? <Text variant="bodySmall" color="textSecondary">{en.vendor.otherStops}</Text> : null}
          {others.map((s) => stopOption(s, false))}
          {error ? <Text color="error">{error}</Text> : null}
        </>
      ) : null}
    </BottomSheet>
  );
}
