import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { useTranslation } from '../../i18n';
import { galleriesService, type GalleryEntity } from '../../services/galleriesService';
import { uploadImage } from '../../services/imageUploadService';

interface PhotoGalleryProps { entity: GalleryEntity; id: string; label?: string }

export function PhotoGallery({ entity, id, label }: PhotoGalleryProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const [images, setImages] = useState<string[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState('');
  const [replacingUrl, setReplacingUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    galleriesService.get(entity, id).then((result) => {
      if (!active) return;
      setImages(result.images);
      setCanManage(result.canManage);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : t('gallery.loadError'));
    });
    return () => { active = false; };
  }, [entity, id, t]);

  const addImage = async (url: string) => {
    const result = await galleriesService.add(entity, id, url);
    setImages(result.images);
  };

  const removeImage = async (url: string) => {
    try {
      const result = await galleriesService.remove(entity, id, url);
      setImages(result.images);
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : t('gallery.removeError'));
    }
  };

  const replaceImage = async (event: ChangeEvent<HTMLInputElement>, previousUrl: string) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setReplacingUrl(previousUrl);
    setError('');
    try {
      const url = await uploadImage(file, 'gallery');
      const result = await galleriesService.replace(entity, id, previousUrl, url);
      setImages(result.images);
    } catch (replaceError: unknown) {
      setError(replaceError instanceof Error ? replaceError.message : t('gallery.replaceError'));
    } finally {
      setReplacingUrl(null);
    }
  };

  return (
    <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6" aria-label={label ?? t('gallery.title')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-pitch-ink">{label ?? t('gallery.title')}</h2>
        {canManage && <ImageUploadField purpose="gallery" label={t('gallery.add')} onUploaded={addImage} />}
      </div>
      {error && <p className="mb-3 text-sm text-rose-700" role="alert">{error}</p>}
      {images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, index) => <figure key={url} className="group relative aspect-square overflow-hidden rounded-2xl border border-pitch-line bg-pitch-panel">
          <a href={url} target="_blank" rel="noreferrer" aria-label={t('gallery.openPhoto')}>
            <img src={url} alt={t('gallery.photoAlt')} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          </a>
          {canManage && <button type="button" onClick={() => void removeImage(url)} aria-label={t('gallery.remove')} className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-700 shadow-md hover:bg-rose-50">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>}
          {canManage && <label htmlFor={`${inputId}-${index}`} title={t('gallery.replace')} className="absolute bottom-2 right-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-pitch-primary shadow-md hover:bg-pitch-light">
            {replacingUrl === url ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
            <input id={`${inputId}-${index}`} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={replacingUrl !== null} onChange={(event) => void replaceImage(event, url)} aria-label={t('gallery.replace')} />
          </label>}
        </figure>)}
      </div> : <p className="rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">{t(canManage ? 'gallery.emptyOwner' : 'gallery.empty')}</p>}
    </section>
  );
}
