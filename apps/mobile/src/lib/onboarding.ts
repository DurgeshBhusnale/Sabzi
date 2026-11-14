import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sabzi.onboardingSeen';

/** TECH-02: once the welcome slides were passed, signed-out starts go straight to sign-in. */
export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1').catch(() => undefined);
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}
