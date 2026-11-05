import { StyleSheet, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../ui/Button';
import { en } from '../../i18n/en';

/** Floating XL "I've arrived" button above the vendor tabs (Today and Stops). */
export function ArriveFab({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: t.spacing.md, paddingHorizontal: t.spacing.screen }]}>
      <Button label={en.nav.arrived} size="fab" icon={MapPin} onPress={onPress} disabled={disabled} testID="arrive-fab" />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' } });
