import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemScreen } from './SystemScreen';
import { en } from '../../i18n/en';

/**
 * TECH-06: route error boundary (expo-router `ErrorBoundary` export). A render error shows this instead of a
 * blank or closed app: Retry re-renders the route, Go home resets to the entry gate.
 */
export function AppErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <SafeAreaProvider>
      <SystemScreen
        illustration="tools"
        art="error"
        title={en.system.crashTitle}
        body={en.system.crashBody}
        actionLabel={en.common.retry}
        onAction={() => {
          retry().catch(() => undefined);
        }}
        secondaryLabel={en.common.goHome}
        onSecondary={() => router.replace('/')}
        testID="crash"
      />
    </SafeAreaProvider>
  );
}
