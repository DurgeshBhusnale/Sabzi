import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { EmptyState, type Illustration } from '../../ui/EmptyState';
import type { IllustrationArt } from '../../ui/Art';
import { Screen } from '../../ui/Screen';

/** Full-screen system state: illustration, one-line title, one line of help, one clear action (§8). */
export function SystemScreen(props: {
  illustration: Illustration;
  /** Picture from the v4 image pack; replaces the icon circle */
  art?: IllustrationArt;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <Screen scroll={false} testID={props.testID}>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: t.spacing.huge }}>
        <EmptyState {...props} testID={props.testID ? `${props.testID}-content` : undefined} />
      </View>
    </Screen>
  );
}
