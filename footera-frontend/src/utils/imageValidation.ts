export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function validateImageFile(file: File): Promise<void> {
  if (!file.size) throw new Error('Le fichier image est vide.');
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error('Image trop volumineuse (5 Mo maximum).');
  if (!allowedTypes.has(file.type)) throw new Error('Format refusé. Choisissez une image PNG, JPEG ou WebP.');

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = header.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte);
  const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isWebp = header.length >= 12
    && String.fromCharCode(...header.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  const detectedType = isPng ? 'image/png' : isJpeg ? 'image/jpeg' : isWebp ? 'image/webp' : null;
  if (!detectedType || detectedType !== file.type) {
    throw new Error('Le type du fichier ne correspond pas au contenu de l’image.');
  }
}
