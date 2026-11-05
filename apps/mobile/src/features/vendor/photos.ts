import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LIMITS } from '@sabzi/shared';

export type CaptureResult = { kind: 'ok'; uri: string; bytes: number } | { kind: 'cancelled' } | { kind: 'denied' };

/**
 * VEN-4: camera only (no gallery), then compress until under 300 KB.
 * Starts at 1280 px wide / 0.7 quality and steps down.
 */
export async function captureCompressed(maxBytes: number = LIMITS.stockPhotoMaxBytes): Promise<CaptureResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { kind: 'denied' };
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false, exif: false });
  if (shot.canceled || !shot.assets?.[0]) return { kind: 'cancelled' };
  return compressUnder(shot.assets[0].uri, maxBytes);
}

export async function compressUnder(uri: string, maxBytes: number): Promise<CaptureResult> {
  const steps: [number, number][] = [
    [1280, 0.7],
    [1080, 0.6],
    [960, 0.5],
    [800, 0.45],
    [640, 0.4],
  ];
  let last = { uri, bytes: Number.POSITIVE_INFINITY };
  for (const [width, compress] of steps) {
    const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], { compress, format: ImageManipulator.SaveFormat.JPEG });
    const bytes = (await (await fetch(out.uri)).blob()).size;
    last = { uri: out.uri, bytes };
    if (bytes <= maxBytes) return { kind: 'ok', ...last };
  }
  return { kind: 'ok', ...last };
}
