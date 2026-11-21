import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen } from '../../src/ui';
import { useMySocieties } from '../../src/features/buyer/hooks';
import { en } from '../../src/i18n/en';

/**
 * Owner review 2026-11-21: confirmation after asking for a society. The buyer is never left stuck: the main action
 * goes back to the picker (with a "pick a society to continue" heading); a buyer who already has a society can
 * go home instead.
 */
export default function SocietyRequested() {
  const { name = '' } = useLocalSearchParams<{ name?: string }>();
  const mine = useMySocieties();
  const hasSociety = (mine.data?.length ?? 0) > 0;
  return (
    <Screen scroll={false}>
      <EmptyState
        art="success"
        title={en.buyer.requestSentTitle}
        body={en.buyer.requestSentBody(name || 'your society')}
        actionLabel={en.buyer.pickNearby}
        onAction={() => router.replace({ pathname: '/buyer-setup/society', params: { after: 'request' } })}
        secondaryLabel={hasSociety ? en.buyer.backHome : undefined}
        onSecondary={hasSociety ? () => router.replace('/(buyer)/home') : undefined}
        testID="society-requested"
      />
    </Screen>
  );
}
