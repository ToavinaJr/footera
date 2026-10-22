import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_IMAGE_UPLOAD_BYTES, validateImageFile } from '../utils/imageValidation';

const pngHeader = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test('accepts an image whose declared MIME matches its PNG signature', async () => {
  const file = new File([pngHeader], 'badge.png', { type: 'image/png' });
  await assert.doesNotReject(validateImageFile(file));
});

test('rejects SVG files, including script-capable image formats', async () => {
  const file = new File(['<svg onload="alert(1)"></svg>'], 'avatar.svg', { type: 'image/svg+xml' });
  await assert.rejects(validateImageFile(file), /Format refusé/);
});

test('rejects a MIME spoof where the file content is not an image', async () => {
  const file = new File(['MZ executable'], 'photo.png', { type: 'image/png' });
  await assert.rejects(validateImageFile(file), /ne correspond pas/);
});

test('rejects files larger than the upload limit before sending them', async () => {
  const file = new File([new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)], 'huge.png', { type: 'image/png' });
  await assert.rejects(validateImageFile(file), /5 Mo maximum/);
});
