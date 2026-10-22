import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient } from '../lib/api/client';
import { validateImageFile } from '../utils/imageValidation';

export { validateImageFile } from '../utils/imageValidation';
export { MAX_IMAGE_UPLOAD_BYTES } from '../utils/imageValidation';
export type ImageUploadPurpose = 'avatar' | 'marketplace' | 'pitch' | 'club-logo';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Fichier image invalide.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, purpose: ImageUploadPurpose): Promise<string> {
  await validateImageFile(file);
  if (IS_MOCK_MODE) return readAsDataUrl(file);

  const formData = new FormData();
  formData.set('file', file);
  formData.set('purpose', purpose);
  const result = await apiClient<{ url: string }>('uploads/images', { method: 'POST', body: formData });
  if (result.url.startsWith('https://') || result.url.startsWith('http://')) return result.url;
  return result.url;
}
