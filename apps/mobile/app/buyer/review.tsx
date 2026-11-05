import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReviewTag } from '@sabzi/shared';
import { Screen, TopAppBar } from '../../src/ui';
import { WriteReviewView } from '../../src/features/engagement/WriteReviewView';
import { myReviewFor, reviewEligibility, submitReview } from '../../src/features/engagement/api';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** B-10 */
export default function WriteReview() {
  const { vendorId, name = '' } = useLocalSearchParams<{ vendorId: string; name: string }>();
  const qc = useQueryClient();
  const elig = useQuery({ queryKey: ['review-elig', vendorId], queryFn: () => reviewEligibility(vendorId) });
  const mine = useQuery({ queryKey: ['my-review', vendorId], queryFn: () => myReviewFor(vendorId) });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen header={<TopAppBar title={en.eng.writeReview} onBack={() => router.back()} />}>
      <WriteReviewView
        key={mine.data?.id ?? 'new'}
        vendorName={name}
        eligibility={mine.isLoading ? undefined : elig.data}
        initial={mine.data ? { stars: mine.data.stars, tags: mine.data.tags as ReviewTag[], text: mine.data.text ?? '' } : undefined}
        submitted={done}
        error={error}
        onSubmit={async (d) => {
          try {
            await submitReview({ vendor_id: vendorId, stars: d.stars, tags: d.tags, text: d.text || undefined });
            track('review_submitted', { stars: d.stars });
            setDone(true);
            qc.invalidateQueries({ queryKey: ['buyer'] });
          } catch (e) {
            setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
          }
        }}
      />
    </Screen>
  );
}
