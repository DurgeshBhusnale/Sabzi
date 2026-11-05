import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** S-08: notification permission (asked only after our rationale screen). */
export async function notificationPermission(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

/** S-09: foreground location only. Never background (CLAUDE.md). */
export async function locationPermission(): Promise<PermissionState> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status as PermissionState;
}

export async function requestLocationPermission(): Promise<PermissionState> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status as PermissionState;
}

/** Reads the position once, with a timeout; null when unavailable. */
export async function currentPosition(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null> {
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => undefined);
}
