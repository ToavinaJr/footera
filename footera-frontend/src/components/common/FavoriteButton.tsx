import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { useTranslation } from '../../i18n';
import { favoriteFields, type FavoriteEntity } from '../../services/favoritesService';

export function FavoriteButton({ entity, id }: { entity: FavoriteEntity; id: string }) {
  const { user, setFavorite, showToast } = useApp();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const selected = user?.[favoriteFields[entity]]?.includes(id) ?? false;
  return <button type="button" aria-label={t('list.favorites')} aria-pressed={selected} disabled={busy || !user}
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-pitch-line bg-white text-pitch-primary disabled:opacity-50"
    onClick={async (event) => {
      event.stopPropagation(); setBusy(true);
      try { await setFavorite(entity, id, !selected); }
      catch (error) { showToast(error instanceof Error ? error.message : t('matches.followError'), 'error'); }
      finally { setBusy(false); }
    }}><Heart className={`h-4 w-4 ${selected ? 'fill-current' : ''}`} /></button>;
}
