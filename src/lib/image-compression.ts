/**
 * Browser-side image downscaling, applied before anything reaches Firebase
 * Storage.
 *
 * Why this exists: the admin panel accepts camera originals. One 16 MB JPEG
 * uploaded to the homepage slideshow became 99% of the page weight and pushed
 * LCP past 12s. It could not be repaired downstream either, because Next's
 * image optimizer times out fetching a file that large, which is what forced
 * the `unoptimized` bypass on Firebase Storage URLs in the first place.
 *
 * Fixing it at the upload boundary is the only place that solves both problems
 * at once: the stored object is small, so the optimizer can handle it and the
 * raw file is survivable even when served unoptimized.
 */

/** Roughly 2x a 1200px CSS hero, so it still looks sharp on retina displays. */
const MAX_DIMENSION = 2400;

/** Visually indistinguishable from source at photographic detail. */
const JPEG_QUALITY = 0.82;

/** Below this, re-encoding costs quality without meaningfully saving bytes. */
const SKIP_BELOW_BYTES = 400 * 1024;

export interface CompressionResult {
  file: File;
  /** True when the returned file is the untouched original. */
  skipped: boolean;
  originalBytes: number;
  finalBytes: number;
}

function canCompressInThisEnvironment(): boolean {
  return (
    typeof document !== 'undefined'
    && typeof createImageBitmap === 'function'
    && typeof HTMLCanvasElement !== 'undefined'
  );
}

function scaleToFit(width: number, height: number) {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= MAX_DIMENSION) return { width, height };
  const ratio = MAX_DIMENSION / longestEdge;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', JPEG_QUALITY);
  });
}

/**
 * Downscales and re-encodes an image to JPEG. Never throws and never blocks an
 * upload: on any failure, or when compression would not help, the original file
 * is returned unchanged so the admin's save still goes through.
 */
export async function compressImageForUpload(file: File): Promise<CompressionResult> {
  const unchanged: CompressionResult = {
    file,
    skipped: true,
    originalBytes: file.size,
    finalBytes: file.size,
  };

  // SVGs are vector and already tiny; GIFs would lose animation through canvas.
  if (!file.type.startsWith('image/')) return unchanged;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return unchanged;
  if (!canCompressInThisEnvironment()) return unchanged;

  let bitmap: ImageBitmap | undefined;
  try {
    // `from-image` applies the EXIF orientation, so phone photos taken in
    // portrait do not come back rotated.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const { width, height } = scaleToFit(bitmap.width, bitmap.height);
    const alreadySmall = width === bitmap.width
      && height === bitmap.height
      && file.size < SKIP_BELOW_BYTES;
    if (alreadySmall) return unchanged;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return unchanged;

    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToJpeg(canvas);
    if (!blob) return unchanged;

    // Re-encoding can inflate an already-optimised file. Keep whichever is
    // smaller so the upload is never made worse.
    if (blob.size >= file.size) return unchanged;

    const stem = file.name.replace(/\.[^./\\]+$/, '') || 'image';
    const compressed = new File([blob], `${stem}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    return {
      file: compressed,
      skipped: false,
      originalBytes: file.size,
      finalBytes: compressed.size,
    };
  } catch (error) {
    console.warn('Image compression failed; uploading the original file.', error);
    return unchanged;
  } finally {
    bitmap?.close();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
