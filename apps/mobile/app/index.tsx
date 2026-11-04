import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME, buyerType, lightColors, spacing } from '@sabzi/shared';
import { en } from '../src/i18n/en';

export default function Placeholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.body}>{en.splash.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightColors.bg,
    padding: spacing.screen,
  },
  title: { ...buyerType.display, color: lightColors.brandLeaf },
  body: { ...buyerType.body, color: lightColors.textSecondary, marginTop: spacing.xs },
});
