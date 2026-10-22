import { useId, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle } from 'lucide-react';
import { ImageUploadPurpose, uploadImage } from '../../services/imageUploadService';

interface ImageUploadFieldProps {
  purpose: ImageUploadPurpose;
  label: string;
  onUploaded: (url: string) => void | Promise<void>;
  disabled?: boolean;
  disabledHint?: string;
  variant?: 'default' | 'avatar';
}

export function ImageUploadField({ purpose, label, onUploaded, disabled = false, disabledHint, variant = 'default' }: ImageUploadFieldProps) {
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

  if (variant === 'avatar') {
    return (
      <div className="absolute bottom-1 right-1 z-10">
        <label
          htmlFor={inputId}
          title={label}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-pitch-action text-white shadow-md transition-colors ${disabled || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-pitch-action-hover'} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pitch-primary`}
        >
          {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          <span className="sr-only">{isUploading ? 'Envoi de la photo en cours' : label}</span>
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
        {error && <p className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-white p-2 text-xs text-rose-700 shadow-md" role="alert">{error}</p>}
        {disabled && disabledHint && <p className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-white p-2 text-xs text-slate-500 shadow-md">{disabledHint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-pitch-line bg-white px-3 py-2 text-xs font-bold text-pitch-primary ${disabled || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-pitch-panel'}`}
      >
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
