import { StyleSheet, View } from 'react-native';
import { REVIEW_TAG_LABELS, type ReviewTag } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { RatingDisplay } from './RatingStars';
import { Text } from './Text';
import { en } from '../i18n/en';

export type ReviewCardData = {
  id: string;
  reviewerName: string;
  societyName?: string | null;
  stars: number;
  tags: string[];
  text?: string | null;
  date: string;
  vendorName?: string;
  vendorReply?: string | null;
  hidden?: boolean;
  hiddenReason?: string | null;
};

export function ReviewCard({ review, footer }: { review: ReviewCardData; footer?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Card testID={`review-${review.id}`} style={{ gap: t.spacing.xs, opacity: review.hidden ? 0.75 : 1 }}>
        <View style={[styles.row, { gap: t.spacing.sm }]}>
          <Avatar name={review.reviewerName} size={36} />
          <View style={styles.flex}>
            <Text weight="600">{review.reviewerName}</Text>
            <Text variant="caption" color="textSecondary">
              {[review.societyName, review.date].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <RatingDisplay value={review.stars} size={14} />
        </View>
        {review.tags.length ? (
          <View style={[styles.row, styles.wrap, { gap: t.spacing.xs }]}>
            {review.tags.map((tag) => (
              <View key={tag} style={{ backgroundColor: t.colors.surface2, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs, paddingVertical: 2 }}>
                <Text variant="caption" color="textSecondary">{REVIEW_TAG_LABELS[tag as ReviewTag] ?? tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {review.text ? <Text>{review.text}</Text> : null}
        {review.vendorReply ? (
          <View testID="vendor-reply" style={{ backgroundColor: t.colors.surface2, borderRadius: t.radius.input, padding: t.spacing.sm }}>
            <Text variant="caption" weight="600">{en.reviews.replyFrom(review.vendorName ?? '')}</Text>
            <Text variant="bodySmall">{review.vendorReply}</Text>
          </View>
        ) : null}
        {footer}
      </Card>
      {review.hidden ? (
        <View testID="review-hidden-note" style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border, borderRadius: t.radius.card, padding: t.spacing.sm, backgroundColor: t.colors.surface2 }}>
          <Text variant="bodySmall" color="textSecondary">{en.reviews.hidden(review.hiddenReason)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, wrap: { flexWrap: 'wrap' }, flex: { flex: 1 } });
