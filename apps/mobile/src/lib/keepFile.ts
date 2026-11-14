import { Directory, File, Paths } from 'expo-file-system';

/**
 * TECH-12: camera/compressor output lives in the cache folder, which Android may clear before a queued upload is
 * sent. A photo that may wait in the offline queue is copied into the app's documents folder first.
 */
const dirName = 'pending-photos';

export async function keepForUpload(uri: string, name: string): Promise<string> {
  try {
    const dir = new Directory(Paths.document, dirName);
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, name);
    if (dest.exists) dest.delete();
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri; // copying failed: the original still works as long as the cache isn't cleared
  }
}

/** Deletes a kept copy after it was uploaded. Ignores anything outside the pending folder. */
export function releaseKept(uri: string): void {
  if (!uri.includes(`/${dirName}/`)) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // a leftover file is harmless
  }
}
