/**
 * Share utility - Web Share API with download fallback
 * No backend required - all client-side
 */

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
  downloadImage(blob, filename);
  return { success: true, method: 'download' };
}

function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
