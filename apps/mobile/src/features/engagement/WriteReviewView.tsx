import { useState } from 'react';
import { View } from 'react-native';
import { formatIstRelative, LIMITS, REVIEW_TAGS, REVIEW_TAG_LABELS, type ReviewTag } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Chip, EmptyState, RatingInput, SkeletonBlock, Text, TextInput } from '../../ui';
import type { Eligibility } from './api';
import { en } from '../../i18n/en';

export type ReviewDraft = { stars: number; tags: ReviewTag[]; text: string };

/** B-10: eligibility states, stars, tags, text, submit, thank-you. */
export function WriteReviewView({
  vendorName,
  eligibility,
  initial,
  onSubmit,
  submitted,
  error,
}: {
  vendorName: string;
  eligibility: Eligibility | undefined;
  initial?: Partial<ReviewDraft>;
  onSubmit: (d: ReviewDraft) => Promise<void>;
  submitted: boolean;
  error?: string | null;
}) {
  const t = useTheme();
  const first = vendorName.split(' ')[0] ?? vendorName;
  const [stars, setStars] = useState(initial?.stars ?? 0);
  const [tags, setTags] = useState<ReviewTag[]>(initial?.tags ?? []);
  const [text, setText] = useState(initial?.text ?? '');
  const [busy, setBusy] = useState(false);

  if (!eligibility) return <SkeletonBlock kind="list" count={2} />;
  if (submitted) return <EmptyState illustration="star" art="success" title={en.eng.thanksTitle} body={en.eng.thanksBody} testID="review-thanks" />;

  const blocked = eligibility.state === 'too_soon' || eligibility.state === 'not_following' || eligibility.state === 'locked';
  return (
    <View style={{ gap: t.spacing.md }} testID={`review-${eligibility.state}`}>
      <Text variant="h1" align="center">{en.eng.rateTitle(first)}</Text>
      {eligibility.state === 'too_soon' ? <Banner kind="info" message={en.eng.notEligible(first, eligibility.days_left)} testID="review-too-soon" /> : null}
      {eligibility.state === 'not_following' ? <Banner kind="info" message={en.eng.notFollowing(first)} /> : null}
      {eligibility.state === 'locked' ? <Banner kind="info" message={en.eng.alreadyReviewed(formatIstRelative(eligibility.unlocks_at))} testID="review-locked-banner" /> : null}
      <RatingInput value={stars} onChange={setStars} disabled={blocked} />
      <Text weight="600">{en.eng.tagsTitle}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
        {REVIEW_TAGS.map((tag) => (
          <Chip key={tag} kind="tag" label={REVIEW_TAG_LABELS[tag]} selected={tags.includes(tag)} disabled={blocked} onPress={() => setTags(tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag])} />
        ))}
      </View>
      <TextInput kind="multiline" label={en.eng.reviewText} maxChars={LIMITS.reviewMaxChars} value={text} onChangeText={setText} disabled={blocked} testID="review-text" />
      <Text variant="caption" color="textSecondary">{en.eng.publicNote}</Text>
      {error ? <Text color="error">{error}</Text> : null}
      <Button
        label={en.eng.submit}
        disabled={blocked || stars === 0}
        loading={busy}
        testID="submit-review"
        onPress={async () => {
          setBusy(true);
          try {
            await onSubmit({ stars, tags, text: text.trim() });
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
