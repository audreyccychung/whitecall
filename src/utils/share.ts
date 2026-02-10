/**
 * Share utility - Web Share API with download fallback
 * No backend required - all client-side
 */

import { downloadBlob } from './download';

export async function shareImage(
  blob: Blob,
  filename: string = 'whitecall-recap.png'
): Promise<{ success: boolean; method: 'share' | 'download' }> {
  const file = new File([blob], filename, { type: 'image/png' });

  // Try native share (iOS Safari, Android Chrome)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'WhiteCall Recap',
      });
      return { success: true, method: 'share' };
    } catch (err) {
      // User cancelled - not an error
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'share' };
      }
      // Fall through to download
    }
  }

  // Fallback: download
  downloadBlob(blob, filename);
  return { success: true, method: 'download' };
}
