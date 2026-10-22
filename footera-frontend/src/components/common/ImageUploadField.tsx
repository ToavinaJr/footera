import { useId, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { ImageUploadPurpose, uploadImage } from '../../services/imageUploadService';

interface ImageUploadFieldProps {
  purpose: ImageUploadPurpose;
  label: string;
  onUploaded: (url: string) => void | Promise<void>;
  disabled?: boolean;
  disabledHint?: string;
}

export function ImageUploadField({ purpose, label, onUploaded, disabled = false, disabledHint }: ImageUploadFieldProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, purpose);
      await onUploaded(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Échec de l’envoi de l’image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#dce6d8] bg-white px-3 py-2 text-xs font-bold text-pitch-primary hover:bg-[#f8faf7] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        <ImagePlus className="h-4 w-4" />
        {isUploading ? 'Envoi en cours…' : label}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={handleChange}
          aria-label={label}
        />
      </label>
      <p className="text-caption text-slate-500">PNG, JPEG ou WebP · 5 Mo max</p>
      {disabled && disabledHint && <p className="text-caption text-slate-500">{disabledHint}</p>}
      {error && <p className="text-xs text-rose-700" role="alert">{error}</p>}
    </div>
  );
}
