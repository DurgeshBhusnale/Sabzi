import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { formatIstRelative, REVIEW_TAGS, REVIEW_TAG_LABELS } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Chip, EmptyState, RatingDisplay, ReviewCard, Screen, SkeletonBlock, Text, TopAppBar } from '../../src/ui';
import { allReviews } from '../../src/features/engagement/api';
import { en } from '../../src/i18n/en';

/** B-09: summary, star and tag filters, review cards with replies; author sees own hidden review. */
export default function AllReviews() {
  const t = useTheme();
  const { vendorId, name = '' } = useLocalSearchParams<{ vendorId: string; name: string }>();
  const q = useQuery({ queryKey: ['reviews', vendorId], queryFn: () => allReviews(vendorId) });
  const [star, setStar] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const visible = (q.data ?? []).filter((r) => r.status === 'visible');
  const list = useMemo(() => (q.data ?? []).filter((r) => (star == null || r.stars === star) && (tag == null || r.tags.includes(tag))), [q.data, star, tag]);
  const avg = visible.length ? visible.reduce((n, r) => n + r.stars, 0) / visible.length : 0;
  const first = name.split(' ')[0] ?? name;
  return (
    <Screen header={<TopAppBar title={en.eng.allReviews} onBack={() => router.back()} />}>
      {q.isLoading ? (
        <SkeletonBlock kind="list" count={3} />
      ) : !q.data?.length ? (
        <EmptyState illustration="star" title={en.buyer.noReviews} testID="reviews-empty" />
      ) : (
        <>
          <Card><RatingDisplay value={avg} count={visible.length} size={20} /></Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
            <Chip label="All" selected={star == null && tag == null} onPress={() => { setStar(null); setTag(null); }} />
            {[5, 4, 3, 2, 1].map((s) => <Chip key={s} label={`${s}★`} selected={star === s} onPress={() => setStar(star === s ? null : s)} />)}
            {REVIEW_TAGS.map((tg) => <Chip key={tg} label={REVIEW_TAG_LABELS[tg]} selected={tag === tg} onPress={() => setTag(tag === tg ? null : tg)} />)}
          </View>
          {list.length === 0 ? <Text color="textSecondary" testID="filter-empty">{en.eng.filterNoResults}</Text> : null}
          {list.map((r) => (
            <ReviewCard key={r.id} review={{ id: r.id, reviewerName: r.reviewer_name, societyName: r.society_name, stars: r.stars, tags: r.tags, text: r.text, date: formatIstRelative(r.created_at), vendorReply: r.vendor_reply, vendorName: first, hidden: r.status === 'hidden', hiddenReason: r.hidden_reason }} />
          ))}
        </>
      )}
      <Button label={en.eng.writeReview} variant="secondary" onPress={() => router.push({ pathname: '/buyer/review', params: { vendorId, name } })} />
    </Screen>
  );
}
