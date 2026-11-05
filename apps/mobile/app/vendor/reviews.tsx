import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { formatIstRelative } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { BottomSheet, Button, Card, EmptyState, RatingDisplay, ReviewCard, Screen, SkeletonBlock, Snackbar, Text, TextInput, TopAppBar } from '../../src/ui';
import { useInvalidateVendor, useMyReviews, useMyVendor, useStats, vendorKeys } from '../../src/features/vendor/hooks';
import { flagReview, replyReview } from '../../src/features/vendor/api';
import { en } from '../../src/i18n/en';

/** V-16: summary, review cards, reply once, flag with reason. */
export default function MyReviews() {
  const t = useTheme();
  const reviews = useMyReviews();
  const stats = useStats();
  const vendor = useMyVendor();
  const invalidate = useInvalidateVendor();
  const [replying, setReplying] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <Screen header={<TopAppBar title={en.vendor.reviewsTitle} onBack={() => router.back()} />}>
      {stats.data && stats.data.rating_count > 0 ? (
        <Card>
          <RatingDisplay value={Number(stats.data.avg_rating)} count={stats.data.rating_count} size={20} />
        </Card>
      ) : null}
      {toast ? <Snackbar kind="success" message={toast} /> : null}
      {reviews.isLoading ? (
        <SkeletonBlock kind="list" count={3} />
      ) : !reviews.data?.length ? (
        <EmptyState illustration="star" title={en.vendor.noReviews} body={en.vendor.noReviewsBody} testID="no-reviews" />
      ) : (
        reviews.data.map((r) => (
          <ReviewCard
            key={r.id}
            review={{ id: r.id, reviewerName: r.reviewer_name, societyName: r.society_name, stars: r.stars, tags: r.tags, text: r.text, date: formatIstRelative(r.created_at), vendorReply: r.vendor_reply, vendorName: vendor.data?.display_name.split(' ')[0] }}
            footer={
              <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
                {!r.vendor_reply ? <Button label={en.vendor.reply} variant="tertiary" fullWidth={false} onPress={() => { setText(''); setReplying(r.id); }} /> : null}
                <Button label={en.vendor.flag} variant="tertiary" fullWidth={false} onPress={() => { setText(''); setFlagging(r.id); }} />
              </View>
            }
          />
        ))
      )}
      <BottomSheet
        visible={!!replying || !!flagging}
        onClose={() => { setReplying(null); setFlagging(null); }}
        title={replying ? en.vendor.reply : en.vendor.flagReason}
        footer={
          <Button
            size="xl"
            label={replying ? en.vendor.postReply : en.vendor.flagSend}
            disabled={!text.trim()}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                if (replying) {
                  await replyReview(replying, text);
                  setToast(en.vendor.replyPosted);
                } else if (flagging) {
                  await flagReview(flagging, text);
                  setToast(en.vendor.flagged);
                }
                await invalidate(vendorKeys.reviews);
              } finally {
                setBusy(false);
                setReplying(null);
                setFlagging(null);
              }
            }}
          />
        }
      >
        <TextInput kind="multiline" maxChars={300} value={text} onChangeText={setText} placeholder={replying ? en.vendor.replyPlaceholder : ''} />
        {replying ? <Text variant="caption" color="textSecondary">{en.reviews.replyFrom(vendor.data?.display_name ?? '')}</Text> : null}
      </BottomSheet>
    </Screen>
  );
}
