/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-off repair for images already sitting in Firebase Storage.
 *
 * New uploads are downscaled in the browser (src/lib/image-compression.ts), but
 * anything uploaded before that shipped is still a camera original. One 16 MB
 * homepage slideshow JPEG accounted for 99% of the page weight and was too
 * large for Next's image optimizer to fetch within its timeout.
 *
 * Each oversized image is rewritten IN PLACE, at the same object path, with its
 * `firebaseStorageDownloadTokens` metadata preserved. That matters: the public
 * download URLs stored in Firestore (hero_slideshow_images, event hero_image,
 * product image) embed that token, so changing it would break every reference.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   node scripts/compress_storage_images.js
 *   node scripts/compress_storage_images.js --apply
 */
const { loadEnvConfig } = require('@next/env');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');

loadEnvConfig(process.cwd());

const apply = process.argv.includes('--apply');

/** Matches MAX_DIMENSION in src/lib/image-compression.ts. */
const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 82;
/** Leave anything already this small alone. */
const REWRITE_ABOVE_BYTES = 600 * 1024;

function initializeAdmin() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const service = JSON.parse(raw);
    return initializeApp({
      credential: cert({
        projectId: service.project_id,
        clientEmail: service.client_email,
        privateKey: service.private_key.replace(/\\n/g, '\n'),
      }),
      projectId: service.project_id,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function isProcessableImage(contentType, name) {
  if (contentType === 'image/svg+xml' || contentType === 'image/gif') return false;
  if (contentType && contentType.startsWith('image/')) return true;
  // Some uploads land without a content type; fall back to the extension.
  return /\.(jpe?g|png|webp|tiff?|heic)$/i.test(name);
}

async function main() {
  initializeAdmin();
  const bucket = getStorage().bucket();
  console.log(`Bucket: ${bucket.name}`);
  console.log(apply ? 'Mode: APPLY (files will be rewritten)\n' : 'Mode: DRY RUN (no writes)\n');

  const [files] = await bucket.getFiles();

  let scanned = 0;
  let rewritten = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  const failures = [];

  for (const file of files) {
    const contentType = file.metadata.contentType || '';
    if (!isProcessableImage(contentType, file.name)) continue;

    scanned += 1;
    const size = Number(file.metadata.size || 0);
    if (size <= REWRITE_ABOVE_BYTES) continue;

    try {
      const [buffer] = await file.download();
      const resized = await sharp(buffer)
        // `rotate()` with no argument bakes in EXIF orientation so portrait
        // photos do not come back sideways once the metadata is stripped.
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      if (resized.length >= buffer.length) {
        console.log(`  skip  ${file.name} (already efficient at ${formatBytes(size)})`);
        continue;
      }

      bytesBefore += buffer.length;
      bytesAfter += resized.length;
      rewritten += 1;
      const saved = ((1 - resized.length / buffer.length) * 100).toFixed(0);
      console.log(
        `  ${apply ? 'write' : 'would'} ${file.name}: `
        + `${formatBytes(buffer.length)} -> ${formatBytes(resized.length)} (-${saved}%)`,
      );

      if (!apply) continue;

      // Preserving downloadTokens keeps every already-stored public URL valid.
      const existingTokens = file.metadata.metadata
        && file.metadata.metadata.firebaseStorageDownloadTokens;

      await file.save(resized, {
        resumable: false,
        contentType: 'image/jpeg',
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: file.metadata.cacheControl || 'public, max-age=31536000, immutable',
          ...(existingTokens
            ? { metadata: { firebaseStorageDownloadTokens: existingTokens } }
            : {}),
        },
      });
    } catch (error) {
      failures.push({ name: file.name, message: error.message });
      console.error(`  FAIL  ${file.name}: ${error.message}`);
    }
  }

  console.log(`\nScanned ${scanned} image(s).`);
  console.log(`${apply ? 'Rewrote' : 'Would rewrite'} ${rewritten}.`);
  if (rewritten > 0) {
    const saved = ((1 - bytesAfter / bytesBefore) * 100).toFixed(0);
    console.log(`Total: ${formatBytes(bytesBefore)} -> ${formatBytes(bytesAfter)} (-${saved}%)`);
  }
  if (failures.length) {
    console.log(`\n${failures.length} file(s) failed:`);
    for (const failure of failures) console.log(`  ${failure.name}: ${failure.message}`);
  }
  if (!apply && rewritten > 0) {
    console.log('\nRe-run with --apply to write these changes.');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
