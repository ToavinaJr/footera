import { apiClient } from '../lib/api/client';
import { validateImageFile } from '../utils/imageValidation';

export { validateImageFile } from '../utils/imageValidation';
export { MAX_IMAGE_UPLOAD_BYTES } from '../utils/imageValidation';
export type ImageUploadPurpose = 'avatar' | 'marketplace' | 'pitch' | 'club-logo';

export async function uploadImage(file: File, purpose: ImageUploadPurpose): Promise<string> {
  await validateImageFile(file);

  const formData = new FormData();
  formData.set('file', file);
  formData.set('purpose', purpose);
  const result = await apiClient<{ url: string }>('uploads/images', { method: 'POST', body: formData });
  if (result.url.startsWith('https://') || result.url.startsWith('http://')) return result.url;
  return result.url;
}
