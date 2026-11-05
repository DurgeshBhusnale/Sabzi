import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { savePushToken } from '../auth/api';

/** Registers the Expo push token and saves it on the profile (NOT-1). No-op on simulators. */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await savePushToken(data);
  return data;
}
