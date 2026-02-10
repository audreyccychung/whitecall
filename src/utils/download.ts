// Shared blob download utility
// Used by: useShareCard (image download), icsGenerator (calendar export)

/**
 * Downloads a Blob as a file to the user's device.
 * Creates a temporary <a> element, triggers click, then cleans up.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
