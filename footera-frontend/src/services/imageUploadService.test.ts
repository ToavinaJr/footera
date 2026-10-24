import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_IMAGE_UPLOAD_BYTES, validateImageFile } from '../utils/imageValidation';
import { formatDateForDisplay, normalizeDateKey } from '../utils/date';

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
  await assert.rejects(validateImageFile(file), /4 Mo maximum/);
});

test('normalizes legacy French booking dates to the date picker format', () => {
  assert.equal(normalizeDateKey('28 Octobre 2026'), '2026-10-28');
  assert.equal(normalizeDateKey('Samedi 24 Octobre 2026'), '2026-10-24');
});

test('formats ISO dates for display without changing the stored value', () => {
  assert.equal(formatDateForDisplay('2026-10-28'), '28 octobre 2026');
  assert.equal(formatDateForDisplay('28 Octobre 2026'), '28 Octobre 2026');
});
